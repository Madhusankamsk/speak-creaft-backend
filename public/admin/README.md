# SpeakCraft Admin Panel

A comprehensive admin dashboard for managing the SpeakCraft English learning application.

## Features

### 🔐 Authentication
- Secure admin login/logout
- JWT token-based authentication
- Session management

### 📊 Dashboard
- Real-time statistics overview
- User growth charts
- Quiz performance analytics
- Recent activity feed

### 👥 User Management
- View all registered users
- Search and filter users
- Update user profiles
- Toggle user status (active/inactive)
- View user quiz results

### ❓ Question Management
- Create, edit, and delete questions
- Categorize questions
- Set difficulty levels
- Toggle question status
- Bulk operations

### 💡 Tip Management
- Create and manage learning tips
- Categorize tips by level
- Upload tip images
- Schedule tip releases

### 📂 Category Management
- Create and manage content categories
- Organize questions and tips
- Category hierarchy

### 📈 Quiz Results
- View all quiz completions
- Filter by date range and level
- Export quiz data
- Performance analytics

### 🔔 Notifications
- Send push notifications to users
- Target specific user groups
- Notification history
- Scheduled notifications

### 📊 Analytics
- User engagement metrics
- Quiz completion rates
- Level distribution charts
- Daily active users tracking

### ⚙️ Settings
- Application configuration
- Quiz settings
- System preferences
- Admin profile management

## Getting Started

### Prerequisites
- Node.js backend running
- MongoDB database
- Admin account created

### Access
1. Navigate to `/admin/login.html`
2. Enter admin credentials
3. Access the dashboard at `/admin/`

### Default Admin Account
Create an admin account in the database:

```javascript
// In MongoDB or via API
{
  "name": "Admin User",
  "email": "admin@speakcraft.com",
  "password": "admin123",
  "isActive": true,
  "role": "admin"
}
```

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/verify` - Verify token

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/activity` - Recent activity

### Users
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get specific user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/toggle-status` - Toggle user status

### Questions
- `GET /api/admin/questions` - Get all questions
- `POST /api/admin/questions` - Create question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

### Tips
- `GET /api/admin/tips` - Get all tips
- `POST /api/admin/tips` - Create tip
- `PUT /api/admin/tips/:id` - Update tip
- `DELETE /api/admin/tips/:id` - Delete tip

### Categories
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Quiz Results
- `GET /api/admin/quiz-results` - Get quiz results
- `DELETE /api/admin/quiz-results/:id` - Delete quiz result

### Notifications
- `GET /api/admin/notifications` - Get notifications
- `POST /api/admin/notifications` - Send notification
- `DELETE /api/admin/notifications/:id` - Delete notification

### Analytics
- `GET /api/admin/analytics/user-growth` - User growth data
- `GET /api/admin/analytics/quiz-performance` - Quiz performance
- `GET /api/admin/analytics/level-distribution` - Level distribution
- `GET /api/admin/analytics/daily-active-users` - Daily active users

### Settings
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## File Structure

```
backend/public/admin/
├── index.html          # Main dashboard
├── login.html          # Login page
├── styles.css          # Main stylesheet
├── js/
│   ├── api.js          # API service
│   ├── main.js         # Main functionality
│   ├── dashboard.js    # Dashboard features
│   ├── users.js        # User management
│   ├── questions.js    # Question management
│   ├── tips.js         # Tip management
│   ├── categories.js   # Category management
│   ├── quizzes.js      # Quiz results
│   ├── notifications.js # Notifications
│   ├── analytics.js    # Analytics
│   └── settings.js     # Settings
└── README.md           # This file
```

## Security Features

- JWT token authentication
- Admin-only routes protection
- Input validation and sanitization
- CSRF protection
- Rate limiting
- Secure password hashing

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Responsive Design

The admin panel is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Customization

### Themes
Modify `styles.css` to customize:
- Color scheme
- Typography
- Layout spacing
- Component styles

### Features
Add new features by:
1. Creating new JavaScript modules
2. Adding routes to the backend
3. Updating the navigation
4. Implementing the UI components

## Troubleshooting

### Common Issues

1. **Login not working**
   - Check admin credentials in database
   - Verify JWT secret in backend
   - Check browser console for errors

2. **Charts not loading**
   - Ensure Chart.js is loaded
   - Check API responses
   - Verify data format

3. **API calls failing**
   - Check authentication token
   - Verify API endpoints
   - Check network connectivity

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Support

For technical support or feature requests, please contact the development team.

## License

This admin panel is part of the SpeakCraft application and follows the same license terms. 