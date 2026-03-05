# DailyCommit 🔥

[![Live Demo](https://img.shields.io/badge/Live%20Demo-daily--commit-7c3aed?style=for-the-badge)](https://daily-commit-theta.vercel.app/)

> Turn your GitHub commits into a daily habit tracker.

## The Problem

Developers want to code consistently, but life gets in the way. GitHub shows activity, but it doesn't make you _feel_ your streak or celebrate milestones. Without clear feedback and accountability, motivation fades and coding gaps grow.

## The Solution

**DailyCommit** transforms raw commit history into a motivational habit tracker:

- **Daily Streaks**: See your current and longest coding streaks at a glance
- **Weekly Heatmap**: Visualize commit intensity with a color-coded calendar
- **Achievement Badges**: Unlock milestones (7-day warrior, 30-day master, year warrior, etc.)
- **Real-time Stats**: Track all-time commits, yearly totals, and progress to your next badge
- **GitHub Integration**: Syncs automatically with your GitHub account via OAuth

Built for developers who want to move from "I code sometimes" to "I code consistently."

## How It Works

1. **Connect GitHub** – Log in securely with GitHub OAuth
2. **Sync Commits** – DailyCommit fetches your commit history and groups by local timezone
3. **Track Streaks** – See current and longest streaks update in real-time
4. **Visualize Progress** – Weekly heatmap shows commit intensity (0 to 11+ commits/day)
5. **Unlock Badges** – Earn achievements at 1, 7, 14, 30, 100, 180, 270, and 365-day streaks
6. **Stay Consistent** – Check your dashboard daily to maintain momentum

## Features

✨ **Streak Tracking** – Current and longest streaks with day-by-day accuracy  
📊 **Weekly Visualization** – GitHub-style commit heatmap with 5-tier intensity colors  
🏆 **8 Achievement Badges** – From "Getting Started" (1 day) to "Year Warrior" (365 days)  
🔄 **Auto-Sync** – Fetch latest commits from GitHub with one click  
🎨 **Clean UI** – Minimal, professional design with smooth animations  
🌙 **Dark Mode** – Purple-themed interface optimized for focus  
💾 **Offline-First** – Local data persistence with smart caching  
🔐 **Secure Auth** – GitHub OAuth login (no credentials stored)

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

- **Primary Purple**: #7C3AED (Vibrant Purple)
- **Accent Purple**: #9F7AEA (Light Purple)
- **Success**: #10B981 (Emerald Green)
- **Warning**: #F59E0B (Amber)
- **Background**: #0A071B (Deep Purple-Black)
- **Secondary**: #1A142C (Dark Purple Card)
- **Border**: #2D2440 (Purple-Gray)
- **Text**: #E9E2F5 (Light Purple-White)

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

3. Open your browser to `http://localhost:5173`

#### Production Build

1. Build the client:

   ```bash
   pnpm build
   ```

2. Start the server (will serve the built client):

   ```bash
   pnpm server
   ```

3. Open your browser to `http://localhost:5000`

## Screenshots

> Add screenshots of Dashboard, Stats, and Weekly Heatmap here

## Design Philosophy

- **Minimalist & Calm**: Premium feel without clutter
- **Professional Animations**: Smooth transitions (200-400ms) that enhance UX without distraction
- **Focus on Productivity**: Data-driven insights, not childish gamification
- **Accessible**: Clear typography, high contrast, keyboard navigation support

## API Routes

- `POST /api/auth/github` - GitHub OAuth login
- `GET /api/github/commits` - Fetch user's GitHub commits
- `GET /api/github/total-commits` - Get total commit counts
- `DELETE /api/user/delete` - Delete user account

## Notes

This project has been converted from React Native to React for web. The purpose remains the same: helping developers maintain daily coding habits through GitHub commit tracking.
