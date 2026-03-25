import React from 'react';

interface ChestXRayIconProps {
  size?: number;
  className?: string;
}

export default function ChestXRayIcon({ size = 24, className = "" }: ChestXRayIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Film outline */}
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      
      {/* Spine */}
      <path d="M12 6v12" />
      
      {/* Left Ribs */}
      <path d="M12 8c-2 0-4 1-5 3" />
      <path d="M12 11c-2 0-4 1-5 3" />
      <path d="M12 14c-2 0-4 1-5 3" />
      
      {/* Right Ribs */}
      <path d="M12 8c2 0 4 1 5 3" />
      <path d="M12 11c2 0 4 1 5 3" />
      <path d="M12 14c2 0 4 1 5 3" />
    </svg>
  );
}
