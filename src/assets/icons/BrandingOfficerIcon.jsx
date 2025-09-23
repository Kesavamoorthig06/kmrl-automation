import React from 'react';

const BrandingOfficerIcon = ({ size = 24, color = "#000000", className = "" }) => {
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
      
      {/* Branding/marketing overlay */}
      <path d="M8 12l2 2 4-4" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="10" cy="10" r="1" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="14" cy="10" r="1" fill="none" stroke={color} strokeWidth="1" />
      <path d="M9 11l1 1 1-1" stroke={color} strokeWidth="1" fill="none" />
    </svg>
  );
};

export default BrandingOfficerIcon;
