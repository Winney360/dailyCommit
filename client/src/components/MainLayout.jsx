import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Settings } from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [touchStart, setTouchStart] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const minSwipeDistance = 80; // Increased threshold
  const maxVerticalDistance = 50; // Max vertical movement allowed for horizontal swipe
  const pageOrder = ['/', '/stats', '/settings'];
  const currentPageIndex = pageOrder.indexOf(location.pathname);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null || touchStartY === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const distanceX = touchStart - touchEndX;
    const distanceY = Math.abs(touchStartY - touchEndY);
    
    // Only trigger swipe if horizontal movement is significant
    // AND vertical movement is minimal (not scrolling)
    const isHorizontalSwipe = Math.abs(distanceX) > minSwipeDistance && distanceY < maxVerticalDistance;
    
    if (!isHorizontalSwipe) {
      setTouchStart(null);
      setTouchStartY(null);
      return;
    }

    const isLeftSwipe = distanceX > 0;
    const isRightSwipe = distanceX < 0;

    if ((isLeftSwipe && currentPageIndex < pageOrder.length - 1) || 
        (isRightSwipe && currentPageIndex > 0)) {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 300);
    }

    if (isLeftSwipe && currentPageIndex < pageOrder.length - 1) {
      navigate(pageOrder[currentPageIndex + 1]);
    } else if (isRightSwipe && currentPageIndex > 0) {
      navigate(pageOrder[currentPageIndex - 1]);
    }
    
    setTouchStart(null);
    setTouchStartY(null);
  };

  const navLinkClass = ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
    isActive 
      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
      : 'text-muted hover:text-primary hover:bg-hover'
  }`;

  const mobileNavClass = ({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-110 ${
    isActive 
      ? 'text-primary' 
      : 'text-muted'
  }`;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-base">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-60 bg-secondary border-r border-custom flex-col p-0 animate-slide-in-left">
        <div className="px-6 py-8 border-b border-custom">
          <h1 className="text-2xl font-bold text-accent hover:text-primary transition-colors duration-300">DailyCommit</h1>
        </div>
        <div className="flex flex-col gap-2 p-6">
          <NavLink to="/" end className={navLinkClass}>
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/stats" className={navLinkClass}>
            <BarChart3 size={20} />
            <span>Stats</span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden bg-secondary border-b border-custom px-4 py-4 animate-slide-down">
        <h1 className="text-xl font-bold text-accent">DailyCommit</h1>
      </div>

      {/* Main Content */}
      <main 
        className={`flex-1 overflow-y-auto bg-base pb-16 md:pb-0 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-75' : 'opacity-100'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-custom flex items-center justify-around py-3 px-2 animate-slide-up">
        <NavLink to="/" end className={mobileNavClass}>
          <Home size={22} />
          <span className="text-xs font-medium">Home</span>
        </NavLink>
        <NavLink to="/stats" className={mobileNavClass}>
          <BarChart3 size={22} />
          <span className="text-xs font-medium">Stats</span>
        </NavLink>
        <NavLink to="/settings" className={mobileNavClass}>
          <Settings size={22} />
          <span className="text-xs font-medium">Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
