# Zema Wetibebe - Q&A Game Platform

A modern, bilingual (English & Amharic) question and answer game platform built with Next.js, designed for interactive quizzes and educational engagement.

## 🎯 Features

### Core Functionality
- **Question Management System** - Create, edit, and manage multiple question types
- **Multiple Question Types**
  - Multiple Choice
  - True/False
  - Short Answer
  - Essay
  - Matching
  - General Knowledge
  - Sign Screen
- **Game Management** - Create and manage quiz games with rounds and teams
- **Interactive Gameplay** - Real-time quiz playing with score tracking
- **Admin Dashboard** - Comprehensive administration panel for users, permissions, and activity logs

### User Experience
- **Bilingual Support** - Full English and Amharic language support with automatic switching
- **Dark/Light Theme** - Theme toggle for user preference
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop devices
- **Real-time Feedback** - Instant validation and audio notifications

### Advanced Features
- **Role-Based Access Control** - Admin, Teacher, and Player roles with permission management
- **Activity Logging** - Track all user actions and changes in the system
- **Time-Limited Questions** - Configurable time limits with audio alarm notifications
- **Progress Tracking** - Monitor question completion and game progress
- **Bulk Question Upload** - Import questions via Excel templates

## 🚀 Technology Stack

- **Frontend Framework** - Next.js 14 with React 18
- **Language** - TypeScript
- **Styling** - Tailwind CSS
- **Authentication** - JWT-based authentication
- **Database** - PostgreSQL (via API)
- **UI Components** - Custom React components with Lucide icons
- **Internationalization** - Custom i18n system with English & Amharic

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes for backend operations
│   ├── dashboard/           # Admin dashboard pages
│   ├── game/               # Game playing interface
│   ├── login/              # Authentication page
│   └── play/               # Game selection page
├── components/             # Reusable React components
│   ├── sidebar.tsx         # Navigation sidebar
│   ├── general-knowledge-question.tsx
│   ├── multiple-choice-question.tsx
│   ├── short-answer-question.tsx
│   └── question-timer.tsx  # Timer component with alarm
├── lib/
│   ├── i18n/              # Internationalization files (en.json, am.json)
│   ├── permissions.ts     # Permission checking utilities
│   └── utils/             # Utility functions
└── styles/                # Global styles
```

## 🎨 UI Design

### Color Scheme
- **Primary Color** - Dark Red (#7a0000, #4d0000 gradient)
- **Accent Colors** - Red (#dc2626, #ef4444)
- **Background** - White/Light Gray (light mode), Dark slate (dark mode)

### Design Features
- Dark red gradient backgrounds for consistency
- Red wavy patterns and dot grids for decorative elements
- Smooth transitions and animations
- Accessible color contrasts

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- PostgreSQL database

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd q-and-a-game-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/quiz_db
JWT_SECRET=your-secret-key
```

4. **Run development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to `http://localhost:3000`

## 📚 Usage Guide

### Admin Features
1. **User Management** - Create and manage users with different roles
2. **Permission Management** - Assign granular permissions to roles
3. **Question Management** - CRUD operations for questions
4. **Round Management** - Organize questions into rounds
5. **Game Management** - Create games and assign teams
6. **Activity Monitoring** - View system activity logs

### Player Features
1. **Browse Games** - See available quiz games
2. **Select Question Type** - Choose from available question types
3. **Answer Questions** - Respond to quiz questions with real-time feedback
4. **Track Score** - Monitor progress and final score
5. **View Feedback** - See correct answers and explanations

## 🌍 Internationalization

The platform supports multiple languages:
- **English** - Default language
- **Amharic** - ሙሉ Amharic support

Switch languages using the language selector in the top-right corner.

Translation files located in:
- `lib/i18n/en.json` - English translations
- `lib/i18n/am.json` - Amharic translations

## 🔐 Authentication & Authorization

### User Roles
1. **Admin** - Full system access
2. **Teacher** - Can manage questions and games
3. **Player** - Can play games and view scores

### Permission System
- Granular permission control
- Role-based access control (RBAC)
- Permission checking on API and UI level

## 🎯 Question Types

### General Knowledge
- Display-only questions without answer selection
- Used for informational content
- Auto-marked as opened when displayed
- Audio alarm when time reaches minimum threshold

### Multiple Choice
- 4 options (A, B, C, D)
- Single correct answer
- Real-time validation

### Short Answer
- Free text input
- Exact match validation
- Configurable time limits

### Other Types
- True/False
- Essay
- Matching
- Sign Screen

## ⏱️ Timer Features

- **Configurable Time Limits** - Set per question type
- **Minimum Time Threshold** - Audio alarm notification
- **Real-time Countdown** - Visual timer display
- **Auto-submit** - Optional automatic submission when time expires

## 📊 Dashboard Statistics

The admin dashboard displays:
- Total games, questions, and rounds count
- Active users and current games
- Questions distribution by type
- Activity timeline
- Game completion rates

## 🧪 Testing

Run tests with:
```bash
npm run test
```

Build for production:
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Common Issues

**Language not switching**
- Clear browser cache
- Check if language files are loaded in network tab
- Verify i18n context is properly wrapped around app

**Timer not showing alarm**
- Ensure `/public/audio/alarm.wav` exists
- Check browser audio permissions
- Verify audio file is not corrupted

**Questions not displaying**
- Verify database connection
- Check API endpoints are accessible
- Ensure questions are properly formatted

## 📝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request with detailed description

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, please contact the development team or create an issue in the repository.

## 🎉 Acknowledgments

Built with ❤️ for the community by the development team.

---

**Version**: 1.0.0  
**Last Updated**: December 2024
