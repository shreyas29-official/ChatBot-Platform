# Chatbot Platform

A minimal yet complete chatbot platform with user authentication, project management, and AI-powered conversations using OpenAI's API.

## Features

- **User Authentication**: JWT-based registration and login
- **Project Management**: Create and manage multiple chatbot projects/agents
- **AI Chat Interface**: Real-time conversations with OpenAI GPT models
- **File Upload**: Attach files to projects (good-to-have feature)
- **Customizable Prompts**: Configure system prompts for each project
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **API**: RESTful endpoints for all operations
- **File Storage**: Local file system with multer
- **AI Integration**: OpenAI API for chat completions

### Frontend (React/Vite)
- **Routing**: React Router for navigation
- **State Management**: Context API for authentication
- **UI**: Tailwind CSS for styling
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Axios for API communication

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API key

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Yellow-Assignment
```

### 2. Install Dependencies
```bash
npm run install-all
```

### 3. Start MongoDB
```bash
# Using MongoDB service (Windows)
net start MongoDB

# Or using mongod directly
mongod --dbpath /path/to/your/db
```

### 4. Environment Configuration

**Backend (.env)**:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
MONGODB_URI=mongodb://localhost:27017/chatbot_platform
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode

**Option 1 - Run both simultaneously**:
```bash
npm run dev
```

**Option 2 - Run separately**:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Build

**Backend**:
```bash
cd backend
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
npm run preview
```

## Database Schema

The application uses MongoDB with the following collections:

- **users**: User accounts with authentication
- **projects**: Chatbot projects/agents
- **messages**: Chat conversation history
- **files**: Uploaded file metadata

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Chat
- `GET /api/chat/:projectId/messages` - Get chat history
- `POST /api/chat/:projectId/messages` - Send message
- `DELETE /api/chat/:projectId/messages` - Clear chat history

### Files
- `POST /api/files/:projectId/upload` - Upload file
- `GET /api/files/:projectId/files` - Get project files
- `DELETE /api/files/files/:fileId` - Delete file

## Deployment

### Cloud Deployment Options

**Heroku**:
- Backend: Deploy as Node.js app with MongoDB Atlas
- Frontend: Deploy to Netlify or Vercel

**AWS**:
- Backend: EC2 or Elastic Beanstalk with MongoDB Atlas
- Frontend: S3 + CloudFront

**Railway/Render**:
- Full-stack deployment with managed MongoDB

**MongoDB Atlas**:
- Use MongoDB Atlas for cloud database
- Update MONGODB_URI in environment variables

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Environment variable protection

## Performance Optimizations

- MongoDB connection pooling
- Efficient queries with proper indexing
- Frontend code splitting
- Image optimization
- Caching strategies

## Scalability Considerations

- Stateless backend design
- MongoDB horizontal scaling (sharding)
- Horizontal scaling ready
- CDN integration for static assets
- Load balancer compatibility

## Error Handling

- Comprehensive error middleware
- Graceful API error responses
- Frontend error boundaries
- User-friendly error messages

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the GitHub repository.