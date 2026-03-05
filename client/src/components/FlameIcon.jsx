import React from 'react';

const FlameIcon = ({ color = '#F59E0B', size = 16 }) => {
  const gradientId = `flame-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
      style={{ animation: 'var(--animate-flame-flicker)' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="0" x2="12" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Outer flame */}
      <path
        d="M12 2C12 2 6 8 6 14C6 18.4 8.7 22 12 22C15.3 22 18 18.4 18 14C18 8 12 2 12 2Z"
        fill={`url(#${gradientId})`}
        opacity="0.9"
      />
      {/* Inner flame */}
      <path
        d="M12 8C12 8 9 11 9 14C9 16.2 10.3 18 12 18C13.7 18 15 16.2 15 14C15 11 12 8 12 8Z"
        fill={color}
        opacity="1"
        filter={`drop-shadow(0 0 4px ${color})`}
      />
      {/* Flame tip */}
      <ellipse
        cx="12"
        cy="12"
        rx="3"
        ry="5"
        fill="#FCD34D"
        opacity="0.8"
      />
    </svg>
  );
};

export default FlameIcon;
