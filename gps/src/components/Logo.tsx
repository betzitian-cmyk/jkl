import React from 'react';
import logoImg from '../assets/images/logo.png';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img 
        src={logoImg} 
        alt="ApplechAI Logo" 
        className="h-10 md:h-12 w-auto object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
