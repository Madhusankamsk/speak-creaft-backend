const mongoose = require('mongoose');
const LegalDocument = require('../src/models/LegalDocument');
const User = require('../src/models/User');
require('dotenv').config();

const seedLegalDocuments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Terms of Service content
    const termsContent = `
# Terms of Service

## 1. Introduction
Welcome to SpeakCraft! These Terms of Service govern your use of our mobile application and services.

## 2. Acceptance of Terms
By downloading, installing, or using SpeakCraft, you agree to be bound by these Terms of Service.

## 3. Description of Service
SpeakCraft is an English learning application that provides:
- Daily English tips and lessons
- Interactive exercises
- Progress tracking
- Community features

## 4. User Accounts
- You must provide accurate information when creating an account
- You are responsible for maintaining the security of your account
- You must not share your account credentials with others

## 5. User Conduct
You agree not to:
- Use the service for any illegal purposes
- Harass or harm other users
- Upload inappropriate content
- Attempt to hack or disrupt the service

## 6. Privacy
Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.

## 7. Content
- All educational content is provided for learning purposes
- You may not redistribute or resell our content
- User-generated content remains your property but you grant us license to use it

## 8. Disclaimers
- The service is provided "as is" without warranties
- We do not guarantee uninterrupted service
- Learning outcomes may vary by individual

## 9. Limitation of Liability
SpeakCraft shall not be liable for any indirect, incidental, or consequential damages.

## 10. Termination
We may terminate accounts that violate these terms. You may delete your account at any time.

## 11. Changes to Terms
We reserve the right to update these terms. Users will be notified of significant changes.

## 12. Contact Information
For questions about these terms, contact us through the app's support feature.

Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    `.trim();

    // Privacy Policy content
    const privacyContent = `
# Privacy Policy

## 1. Introduction
SpeakCraft ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.

## 2. Information We Collect

### Personal Information
- Name and email address
- Profile information you provide
- Learning preferences and progress

### Usage Data
- App usage statistics
- Learning progress and quiz results
- Time spent in the app
- Features used

### Device Information
- Device type and operating system
- App version
- Unique device identifiers

## 3. How We Use Your Information
We use your information to:
- Provide and improve our educational services
- Track your learning progress
- Send you daily tips and notifications
- Provide customer support
- Analyze app usage to improve features

## 4. Information Sharing
We do not sell or rent your personal information. We may share information:
- With your consent
- To comply with legal requirements
- With service providers who help us operate the app
- In anonymized form for research purposes

## 5. Data Security
We implement appropriate security measures to protect your information:
- Encryption of sensitive data
- Secure servers and databases
- Regular security audits
- Limited access to personal information

## 6. Your Rights
You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your account and data
- Opt out of marketing communications
- Download your data

## 7. Data Retention
We retain your information as long as your account is active or as needed to provide services. You can request deletion at any time.

## 8. Children's Privacy
Our service is not intended for children under 13. We do not knowingly collect information from children under 13.

## 9. International Data Transfers
Your information may be transferred to servers outside your country. We ensure appropriate safeguards are in place.

## 10. Cookies and Tracking
We use minimal tracking technologies to improve app performance and user experience.

## 11. Changes to Privacy Policy
We will notify you of any material changes to this Privacy Policy through the app or email.

## 12. Contact Us
For privacy-related questions or to exercise your rights, contact us through the app's support feature.

Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    `.trim();

    // Find or create a system user for lastUpdatedBy
    let systemUser = await User.findOne({ email: 'system@speakcraft.com' });
    if (!systemUser) {
      systemUser = new User({
        name: 'System Admin',
        email: 'system@speakcraft.com',
        password: 'system-generated-password',
        role: 'admin',
        level: 10,
        isEmailVerified: true
      });
      await systemUser.save();
      console.log('✅ System user created');
    }

    // Check if documents already exist
    const existingTerms = await LegalDocument.findOne({ type: 'terms_of_service' });
    const existingPrivacy = await LegalDocument.findOne({ type: 'privacy_policy' });

    if (!existingTerms) {
      const termsDoc = new LegalDocument({
        type: 'terms_of_service',
        title: 'Terms of Service',
        content: termsContent,
        version: '1.0',
        effectiveDate: new Date(),
        isActive: true,
        lastUpdatedBy: systemUser._id
      });
      
      await termsDoc.save();
      console.log('✅ Terms of Service created successfully');
    } else {
      console.log('ℹ️ Terms of Service already exists');
    }

    if (!existingPrivacy) {
      const privacyDoc = new LegalDocument({
        type: 'privacy_policy',
        title: 'Privacy Policy',
        content: privacyContent,
        version: '1.0',
        effectiveDate: new Date(),
        isActive: true,
        lastUpdatedBy: systemUser._id
      });
      
      await privacyDoc.save();
      console.log('✅ Privacy Policy created successfully');
    } else {
      console.log('ℹ️ Privacy Policy already exists');
    }

    console.log('🎉 Legal documents seeding completed');
    
  } catch (error) {
    console.error('❌ Error seeding legal documents:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding function
if (require.main === module) {
  seedLegalDocuments();
}

module.exports = seedLegalDocuments;