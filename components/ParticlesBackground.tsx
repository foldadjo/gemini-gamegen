import React, { useEffect, useRef } from 'react';

export const ParticlesBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random starting position
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      
      // Random size
      const size = Math.random() * 40 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random animation duration
      const duration = Math.random() * 10 + 10;
      particle.style.animationDuration = `${duration}s`;
      
      container.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, duration * 1000);
    };

    // Create initial particles
    for (let i = 0; i < 50; i++) {
      createParticle();
    }

    // Create new particles periodically
    const interval = setInterval(() => {
      createParticle();
    }, 200);

    return () => {
      clearInterval(interval);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="particles" />;
}; 