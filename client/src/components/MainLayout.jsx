import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, BarChart3, Settings } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-base">
      <nav className="w-60 bg-secondary border-r border-custom flex flex-col p-0">
        <div className="px-6 py-8 border-b border-custom">
          <h1 className="text-2xl font-bold text-accent">DailyCommit</h1>
        </div>
        <div className="flex flex-col gap-2 p-6">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            isActive ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-hover'
          }`}>
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            isActive ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-hover'
          }`}>
            <BarChart3 size={20} />
            <span>Stats</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            isActive ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-hover'
          }`}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto bg-base">
        <Outlet />
      </main>
    </div>
  );
}
