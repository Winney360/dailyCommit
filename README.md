# DailyCommit

A premium-quality habit-forming productivity app that helps developers maintain a daily coding habit by tracking GitHub commit activity and visualizing progress with daily streaks and statistics.

## Project Overview

DailyCommit is built with React for the web frontend and Express.js for the backend. The app uses a calming, minimal design with an Emerald/Teal green color scheme and warm orange accents.

## Tech Stack

### Frontend (client/)
- React (Web)
- React Router for navigation
- localStorage for local data persistence
- React Query for data fetching
- Vite for build tooling
- CSS for styling
- JavaScript/JSX only (no TypeScript)

### Backend (server/)
- Express.js
- MongoDB for data storage
- GitHub OAuth integration
- Node.js

## Project Structure

```
├── client/                   # React web app
│   ├── src/
│   │   ├── App.jsx          # Main app entry point
│   │   ├── index.jsx        # React DOM entry
│   │   ├── index.css        # Global styles
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication state
│   │   ├── lib/
│   │   │   ├── api.js           # API client
│   │   │   ├── storage.js       # localStorage utilities
│   │   │   ├── token-storage.js # Token management
│   │   │   └── query-client.js  # React Query setup
│   │   └── screens/         # App screens
│   │       ├── LoginScreen.jsx
│   │       ├── DashboardScreen.jsx
│   │       ├── StatsScreen.jsx
│   │       └── SettingsScreen.jsx
│   ├── index.html           # HTML entry point
│   ├── vite.config.js       # Vite configuration
│   └── package.json
├── server/                   # Express.js backend
│   ├── index.js             # Server entry point
│   ├── routes.js            # API routes
│   ├── db.js                # MongoDB connection
│   └── package.json
└── .env.example             # Environment variables template
```

## Color Palette

- **Primary**: #10B981 (Emerald Green)
- **Background**: #0A071B (Deep Purple-Black)
- **Card**: #1A142C (Dark Purple)
- **Border**: #2D2440 (Purple-Gray)
- **Text**: #E9E2F5 (Light Purple-White)
- **Accent**: #F97316 (Warm Orange)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (package manager)
- MongoDB (local or cloud instance)

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration:
   - Set your MongoDB URI
   - Add GitHub OAuth credentials (create an OAuth app at https://github.com/settings/developers)
   - Update redirect URI to match your GitHub OAuth app settings

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the App

#### Development Mode

1. Start the server (in one terminal):
   ```bash
   pnpm server
   ```

2. Start the client (in another terminal):
   ```bash
   pnpm client
   ```

3. Open your browser to `http://localhost:3000`

#### Production Build

1. Build the client:
   ```bash
   pnpm build
   ```

2. Start the server (will serve the built client):
   ```bash
   pnpm server
   ```

3. Open your browser to `http://localhost:5001`

## Features

- GitHub OAuth login (or demo mode)
- Daily commit tracking with streak counter
- Weekly activity visualization
- Statistics and achievements
- Badge/milestone system
- Dark mode design
- Local data persistence

## User Preferences

- Minimalist, calm design
- Premium feel without clutter
- Focus on productivity
- No childish gamification

## API Routes

- `POST /api/auth/github` - GitHub OAuth login
- `GET /api/github/commits` - Fetch user's GitHub commits
- `GET /api/github/total-commits` - Get total commit counts
- `DELETE /api/user/delete` - Delete user account

## Notes

This project has been converted from React Native to React for web. The purpose remains the same: helping developers maintain daily coding habits through GitHub commit tracking.
