import React from 'react';

const AdminIcon = ({ size = 24, color = "#000000", className = "" }) => {
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
      
      {/* Admin crown overlay */}
      <path d="M8 10l2-1 2 1 2-1 2 1v1H8v-1z" fill={color} />
      <circle cx="10" cy="9" r="0.5" fill={color} />
      <circle cx="12" cy="9" r="0.5" fill={color} />
      <circle cx="14" cy="9" r="0.5" fill={color} />
    </svg>
  );
};

export default AdminIcon;
