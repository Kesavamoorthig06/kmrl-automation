import React from 'react';

const YardCrewIcon = ({ size = 24, color = "#000000", className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Person silhouette */}
      <circle cx="12" cy="8" r="3" fill={color} />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="2" fill="none" />
      
      {/* Yard/train yard overlay */}
      <rect x="6" y="14" width="12" height="2" fill={color} opacity="0.3" />
      <rect x="7" y="16" width="2" height="1" fill={color} />
      <rect x="11" y="16" width="2" height="1" fill={color} />
      <rect x="15" y="16" width="2" height="1" fill={color} />
    </svg>
  );
};

export default YardCrewIcon;