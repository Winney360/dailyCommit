import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, BarChart3, Settings } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-950">
      <nav className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col p-0">
        <div className="px-6 py-8 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-blue-500">DailyCommit</h1>
        </div>
        <div className="flex flex-col gap-2 p-6">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}>
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}>
            <BarChart3 size={20} />
            <span>Stats</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
}
