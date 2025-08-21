'use client';

import React from 'react';

interface HyreliqLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

const HyreliqLogo: React.FC<HyreliqLogoProps> = ({ 
  size = 'medium', 
  className = '',
  onClick 
}) => {
  return (
    <div 
      className={`hyreliq-logo size-${size} ${className}`}
      onClick={onClick}
    >
      <div className="hyreliq-dot" />
      <div className="hyreliq-text">hyreliq</div>
    </div>
  );
};

export default HyreliqLogo;
