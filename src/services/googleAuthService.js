const { OAuth2Client } = require('google-auth-library');
const { logInfo, logError } = require('../utils/helpers');

class GoogleAuthService {
  constructor() {
    // Google OAuth 2.0 configuration
    this.clientIds = {
      ios: process.env.GOOGLE_IOS_CLIENT_ID,
      android: process.env.GOOGLE_ANDROID_CLIENT_ID,
      web: process.env.GOOGLE_WEB_CLIENT_ID
    };
    
    // Create OAuth2 clients for each platform
    this.clients = {};
    
    Object.keys(this.clientIds).forEach(platform => {
      if (this.clientIds[platform]) {
        this.clients[platform] = new OAuth2Client(this.clientIds[platform]);
      }
    });
  }

  /**
   * Verify Google ID token
   * @param {string} idToken - Google ID token from client
   * @param {string} platform - Platform (ios, android, web)
   * @returns {Object} Verified user payload or null
   */
  async verifyIdToken(idToken, platform = 'web') {
    try {
      const client = this.clients[platform];
      if (!client) {
        throw new Error(`No Google OAuth client configured for platform: ${platform}`);
      }

      logInfo('Verifying Google ID token', { platform });

      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: this.clientIds[platform],
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid Google ID token');
      }

      logInfo('Google ID token verified successfully', { 
        userId: payload.sub,
        email: payload.email,
        platform 
      });

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
        locale: payload.locale,
      };
    } catch (error) {
      logError(error, 'verifyIdToken');
      return null;
    }
  }

  /**
   * Verify Google access token
   * @param {string} accessToken - Google access token from client
   * @returns {Object} User info or null
   */
  async verifyAccessToken(accessToken) {
    try {
      logInfo('Verifying Google access token');

      // Use any client to verify the access token
      const client = Object.values(this.clients)[0];
      if (!client) {
        throw new Error('No Google OAuth client configured');
      }

      // Get user info using access token
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify access token');
      }

      const userInfo = await response.json();

      logInfo('Google access token verified successfully', { 
        userId: userInfo.id,
        email: userInfo.email 
      });

      return {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        picture: userInfo.picture,
        emailVerified: userInfo.verified_email,
        locale: userInfo.locale,
      };
    } catch (error) {
      logError(error, 'verifyAccessToken');
      return null;
    }
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from client
   * @param {string} platform - Platform (ios, android, web)
   * @returns {Object} Token information or null
   */
  async exchangeCodeForTokens(code, platform = 'web') {
    try {
      const client = this.clients[platform];
      if (!client) {
        throw new Error(`No Google OAuth client configured for platform: ${platform}`);
      }

      logInfo('Exchanging authorization code for tokens', { platform });

      const { tokens } = await client.getToken(code);
      
      if (!tokens.id_token) {
        throw new Error('No ID token received');
      }

      // Verify the ID token
      const userInfo = await this.verifyIdToken(tokens.id_token, platform);
      
      if (!userInfo) {
        throw new Error('Failed to verify ID token');
      }

      logInfo('Authorization code exchanged successfully', { 
        userId: userInfo.googleId,
        email: userInfo.email,
        platform 
      });

      return {
        userInfo,
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
          expiryDate: tokens.expiry_date,
        }
      };
    } catch (error) {
      logError(error, 'exchangeCodeForTokens');
      return null;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @param {string} platform - Platform (ios, android, web)
   * @returns {Object} New tokens or null
   */
  async refreshAccessToken(refreshToken, platform = 'web') {
    try {
      const client = this.clients[platform];
      if (!client) {
        throw new Error(`No Google OAuth client configured for platform: ${platform}`);
      }

      logInfo('Refreshing Google access token', { platform });

      client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await client.refreshAccessToken();

      logInfo('Google access token refreshed successfully', { platform });

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token,
        idToken: credentials.id_token,
        expiryDate: credentials.expiry_date,
      };
    } catch (error) {
      logError(error, 'refreshAccessToken');
      return null;
    }
  }

  /**
   * Check if Google OAuth is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    const hasAnyClient = Object.keys(this.clients).length > 0;
    if (!hasAnyClient) {
      logError(new Error('No Google OAuth clients configured'), 'isConfigured');
    }
    return hasAnyClient;
  }

  /**
   * Get configuration status for each platform
   * @returns {Object} Configuration status
   */
  getConfigurationStatus() {
    return {
      ios: !!this.clientIds.ios && !!this.clients.ios,
      android: !!this.clientIds.android && !!this.clients.android,
      web: !!this.clientIds.web && !!this.clients.web,
      hasAnyPlatform: Object.keys(this.clients).length > 0
    };
  }
}

module.exports = new GoogleAuthService();