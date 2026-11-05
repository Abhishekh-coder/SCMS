import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Primary brand blob — top right */}
      <div className="ambient-blob w-[600px] h-[600px] bg-brand -top-48 -right-32 animate-float" />
      
      {/* Secondary cyan blob — bottom left */}
      <div className="ambient-blob w-[400px] h-[400px] bg-cyan-500 bottom-0 -left-24 animate-float-slow" 
           style={{ animationDelay: '5s' }} />
      
      {/* Tertiary purple blob — center */}
      <div className="ambient-blob w-[300px] h-[300px] bg-purple-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" 
           style={{ animationDelay: '10s', opacity: 0.02 }} />
      
      {/* Subtle radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-surface/50" />
    </div>
  );
}
