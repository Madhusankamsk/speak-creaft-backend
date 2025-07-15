# SpeakCraft Backend API

A comprehensive Node.js backend API for the SpeakCraft language learning application, featuring user authentication, quiz assessment, daily tip unlocking, and admin management.

## 🚀 Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Quiz System**: English assessment quiz with level-based scoring (1-10)
- **Daily Tip Unlocking**: Time-based tip unlocking at 9 AM, 2 PM, and 7 PM
- **Admin Panel**: Complete admin dashboard with user management and analytics
- **Real-time Notifications**: Socket.io integration for live updates
- **File Upload**: Cloudinary integration for image uploads
- **Rate Limiting**: Express rate limiting for API protection
- **Validation**: Comprehensive request validation using express-validator
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Morgan HTTP request logging
- **Security**: Helmet.js for security headers and CORS protection

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Cloudinary
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB instance running
- Cloudinary account (for file uploads)
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment example
cp env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup

```bash
# Start MongoDB (if running locally)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── uploads/            # File upload directory
├── tests/              # Test files
├── scripts/            # Database seeding
├── .env               # Environment variables
├── package.json       # Dependencies
└── README.md          # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/speakcraft` |
| `JWT_SECRET` | JWT signing secret | Required |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Required |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Required |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Required |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/admin/login` - Admin login

### Quiz
- `GET /api/quiz/questions` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers

### Tips
- `GET /api/tips` - Get available tips
- `GET /api/tips/:id` - Get specific tip
- `POST /api/tips/:id/interact` - Mark tip as read/favorite

### Daily Unlock
- `GET /api/daily-unlock/status` - Get today's unlock status
- `GET /api/daily-unlock/check` - Check and unlock tips
- `GET /api/daily-unlock/history` - Get unlock history

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/progress/categories` - Get category progress

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get specific user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User
- Basic info (name, email, password)
- Quiz completion status and score
- Level assignment (1-10)
- Activity tracking

### Admin
- Admin credentials and permissions
- Activity logging

### Question
- Quiz questions with multiple choice options
- Category and level assignment
- Correct answer and explanation

### Tip
- Daily tips with content and metadata
- Category and level assignment
- Image support

### DailyUnlock
- Daily tip unlocking schedule
- User-specific unlock tracking

### UserTipInteraction
- User interactions with tips
- Read/favorite status tracking

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

Once the server is running, visit:
- API Overview: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/health`

## 🔄 Daily Unlock System

The daily unlock system automatically unlocks 3 tips per day at specific times:
- **9:00 AM** - First tip
- **2:00 PM** - Second tip  
- **7:00 PM** - Third tip

Tips are selected randomly from the user's assigned level and are not repeated until all tips at that level have been unlocked.

## 🛡️ Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: API request rate limiting
- **CORS Protection**: Cross-origin resource sharing control
- **Helmet.js**: Security headers
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure MongoDB Atlas or production database
4. Set up Cloudinary credentials
5. Configure CORS for production domain
6. Set up SSL/TLS certificates
7. Configure reverse proxy (nginx)
8. Set up monitoring and logging

### Docker Deployment

```bash
# Build Docker image
docker build -t speakcraft-backend .

# Run container
docker run -p 5000:5000 --env-file .env speakcraft-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Authentication system
- Quiz assessment
- Daily tip unlocking
- Admin panel
- Real-time notifications 