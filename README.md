# DailyCommit

A premium-quality habit-forming productivity app that helps developers maintain a daily coding habit by tracking GitHub commit activity, sending intelligent push notifications, maintaining daily streaks, and visualizing progress.

## Project Overview

DailyCommit is built with React Native (Expo) for the mobile frontend and Express.js for the backend. The app uses a calming, minimal design with an Emerald/Teal green color scheme and warm orange accents.

## Tech Stack

### Frontend (client/)
- React Native with Expo
- React Navigation for navigation
- AsyncStorage for local data persistence
- React Query for data fetching
- Reanimated for animations
- JavaScript/JSX only (no TypeScript)

### Backend (server/)
- Express.js
- GitHub OAuth integration
- Node.js

## Project Structure

```
├── client/                   # React Native Expo app
│   ├── App.jsx              # Main app entry point
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── HeaderTitle.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MotivationCard.jsx
│   │   ├── SettingsItem.jsx
│   │   ├── StreakCounter.jsx
│   │   ├── TodayStatus.jsx
│   │   ├── ThemedText.jsx
│   │   ├── ThemedView.jsx
│   │   └── WeeklyChart.jsx
│   ├── constants/
│   │   └── theme.js         # Colors, spacing, typography
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state
│   ├── hooks/               # Custom hooks
│   ├── lib/
│   │   ├── query-client.js  # API client
│   │   └── storage.js       # AsyncStorage utilities
│   ├── navigation/          # React Navigation setup
│   └── screens/             # App screens
│       ├── LoginScreen.jsx
│       ├── DashboardScreen.jsx
│       ├── StatsScreen.jsx
│       └── SettingsScreen.jsx
├── server/                   # Express.js backend
│   ├── index.ts             # Server entry point
│   └── routes.ts            # API routes
└── assets/                   # Images and icons
```

## Color Palette

- **Primary**: #10B981 (Emerald Green)
- **Secondary**: #374151 (Charcoal)
- **Accent**: #F97316 (Warm Orange)
- **Success**: #059669 (Muted Green)
- **Warning**: #F59E0B (Soft Amber)
- **NO BLUE OR PURPLE ALLOWED**

## Running the App

### Development
1. Start the backend: `npm run server:dev`
2. Start the frontend: `npm run expo:dev`

### Testing on Device
Scan the QR code with Expo Go app on your mobile device.

## Features

- GitHub OAuth login (or demo mode)
- Daily commit tracking with streak counter
- Weekly activity visualization
- Motivational messages
- Badge/milestone system
- Dark mode support
- Local data persistence

## User Preferences

- Minimalist, calm design
- Premium feel without clutter
- Focus on productivity
- No childish gamification
