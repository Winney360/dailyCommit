import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Settings } from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [touchStart, setTouchStart] = useState(null);

  const minSwipeDistance = 50;
  const pageOrder = ['/', '/stats', '/settings'];
  const currentPageIndex = pageOrder.indexOf(location.pathname);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEndPos = e.changedTouches[0].clientX;
    const distance = touchStart - touchEndPos;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPageIndex < pageOrder.length - 1) {
      // Swipe left - go to next page
      navigate(pageOrder[currentPageIndex + 1]);
    } else if (isRightSwipe && currentPageIndex > 0) {
      // Swipe right - go to previous page
      navigate(pageOrder[currentPageIndex - 1]);
    }
    
    setTouchStart(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-base">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-60 bg-secondary border-r border-custom flex-col p-0">
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

      {/* Mobile Header */}
      <div className="md:hidden bg-secondary border-b border-custom px-4 py-4">
        <h1 className="text-xl font-bold text-accent">DailyCommit</h1>
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto bg-base pb-16 md:pb-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-custom flex items-center justify-around py-3 px-2">
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
          isActive ? 'text-primary' : 'text-muted'
        }`}>
          <Home size={22} />
          <span className="text-xs font-medium">Home</span>
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
          isActive ? 'text-primary' : 'text-muted'
        }`}>
          <BarChart3 size={22} />
          <span className="text-xs font-medium">Stats</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
          isActive ? 'text-primary' : 'text-muted'
        }`}>
          <Settings size={22} />
          <span className="text-xs font-medium">Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
