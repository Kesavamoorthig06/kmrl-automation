import React from 'react';

const OperationalCrewIcon = ({ size = 24, color = "#000000", className = "" }) => {
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
      
      {/* Operational controls overlay */}
      <rect x="8" y="12" width="8" height="1" fill={color} />
      <rect x="9" y="13.5" width="2" height="0.5" fill={color} />
      <rect x="13" y="13.5" width="2" height="0.5" fill={color} />
      <circle cx="10" cy="14.5" r="0.5" fill={color} />
      <circle cx="14" cy="14.5" r="0.5" fill={color} />
    </svg>
  );
};

export default OperationalCrewIcon;
