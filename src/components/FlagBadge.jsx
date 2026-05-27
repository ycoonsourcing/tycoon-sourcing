import React from 'react';

export function AUFlag({ size = 'sm' }) {
  const w = size === 'sm' ? 24 : 32;
  const h = size === 'sm' ? 16 : 22;
  return (
    <svg width={w} height={h} viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" style={{borderRadius:2,flexShrink:0}}>
      <rect width="24" height="16" fill="#00247D"/>
      {/* Union Jack simplified */}
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="3"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="3"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CF142B" strokeWidth="1.5"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CF142B" strokeWidth="1.5"/>
      <line x1="0" y1="4" x2="12" y2="4" stroke="white" strokeWidth="2.5"/>
      <line x1="6" y1="0" x2="6" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="0" y1="4" x2="12" y2="4" stroke="#CF142B" strokeWidth="1.2"/>
      <line x1="6" y1="0" x2="6" y2="8" stroke="#CF142B" strokeWidth="1.2"/>
      {/* Stars area right side */}
      <rect x="12" y="0" width="12" height="16" fill="#00247D"/>
      {/* Southern Cross dots */}
      <circle cx="19" cy="4" r="1" fill="white"/>
      <circle cx="22" cy="7" r="1" fill="white"/>
      <circle cx="19" cy="11" r="1" fill="white"/>
      <circle cx="15" cy="7" r="1" fill="white"/>
      <circle cx="19" cy="8" r="0.7" fill="white"/>
    </svg>
  );
}

export function SLFlag({ size = 'sm' }) {
  const w = size === 'sm' ? 24 : 32;
  const h = size === 'sm' ? 16 : 22;
  return (
    <svg width={w} height={h} viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" style={{borderRadius:2,flexShrink:0}}>
      <rect width="24" height="16" fill="#8D153A"/>
      {/* Orange stripe */}
      <rect x="0" y="0" width="3" height="16" fill="#FF7300"/>
      {/* Green stripe */}
      <rect x="3" y="0" width="3" height="16" fill="#1B7A3E"/>
      {/* Gold border */}
      <rect x="6" y="0" width="1" height="16" fill="#FFA500" opacity="0.6"/>
      {/* Lion simplified as gold rectangle */}
      <rect x="8" y="3" width="12" height="10" rx="2" fill="#FFA500" opacity="0.3"/>
      <text x="14" y="12" textAnchor="middle" fontSize="7" fill="#FFD700" fontWeight="bold" fontFamily="Arial">SRI LANKA</text>
    </svg>
  );
}
