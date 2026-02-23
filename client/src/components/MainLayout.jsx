import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, BarChart3, Settings } from 'lucide-react';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <nav className="sidebar">
        <div className="app-brand">
          <h1>DailyCommit</h1>
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <BarChart3 size={20} />
            <span>Stats</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
