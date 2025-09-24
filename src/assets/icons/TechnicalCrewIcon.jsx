import React from 'react';

const TechnicalCrewIcon = ({ size = 24, color = "#000000", className = "" }) => {
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
      
      {/* Technical tools overlay */}
      <path d="M8 12l1-1 2 2-1 1" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="9" cy="11" r="0.5" fill={color} />
      <path d="M15 12l-1-1-2 2 1 1" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="15" cy="11" r="0.5" fill={color} />
    </svg>
  );
};

export default TechnicalCrewIcon;
