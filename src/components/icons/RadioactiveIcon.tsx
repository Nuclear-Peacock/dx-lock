import React from 'react';

interface RadioactiveIconProps {
  size?: number;
  className?: string;
}

export default function RadioactiveIcon({ size = 24, className = "" }: RadioactiveIconProps) {
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
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 14c1.5 0 3 1 3 3v2a5 5 0 0 1-6 0v-2c0-2 1.5-3 3-3Z" fill="currentColor" />
      <path d="M10.27 11c-.75-1.3-2.25-2.17-3.75-1.3l-1.73 1a5 5 0 0 0 3 5.2l1.73-1c1.3-.75 1.5-2.6.75-3.9Z" fill="currentColor" />
      <path d="M13.73 11c.75-1.3 2.25-2.17 3.75-1.3l1.73 1a5 5 0 0 1-3 5.2l-1.73-1c-1.3-.75-1.5-2.6-.75-3.9Z" fill="currentColor" />
    </svg>
  );
}
