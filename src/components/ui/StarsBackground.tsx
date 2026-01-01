'use client';
import { useEffect, useRef } from 'react';

export function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Configuration
    const STAR_COUNT = 200;
    const METEOR_COUNT = 4;
    
    // State
    const stars: {x: number, y: number, size: number, opacity: number, speed: number}[] = [];
    const meteors: {x: number, y: number, length: number, speed: number, angle: number}[] = [];

    // Initialize
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    // Create Stars
    for(let i=0; i<STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5,
        opacity: Math.random(),
        speed: Math.random() * 0.05
      });
    }

    // Create Meteors (Reset)
    const resetMeteor = (m: any) => {
      m.x = Math.random() * width * 1.5 - width * 0.5;
      m.y = -100;
      m.length = Math.random() * 80 + 20;
      m.speed = Math.random() * 5 + 10;
      m.angle = Math.PI / 4; // 45 degrees
    };

    for(let i=0; i<METEOR_COUNT; i++) {
        const m = { x: 0, y: 0, length: 0, speed: 0, angle: 0 };
        resetMeteor(m);
        m.y = Math.random() * height; // Distribute initially
        meteors.push(m);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Stars
      ctx.fillStyle = 'white';
      stars.forEach(star => {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Twinkle
        star.opacity += (Math.random() - 0.5) * 0.02;
        if(star.opacity < 0.1) star.opacity = 0.1;
        if(star.opacity > 0.8) star.opacity = 0.8;
      });

      // Draw Meteors
      meteors.forEach(m => {
        // Update
        m.x += m.speed * Math.cos(m.angle);
        m.y += m.speed * Math.sin(m.angle);

        // Reset if out of bounds
        if (m.y > height + 100 || m.x > width + 100) {
            // Random chance to respawn to stagger them
            if(Math.random() > 0.98) resetMeteor(m);
        } else {
            // Draw tail
            const gradient = ctx.createLinearGradient(m.x, m.y, m.x - m.length * Math.cos(m.angle), m.y - m.length * Math.sin(m.angle));
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.length * Math.cos(m.angle), m.y - m.length * Math.sin(m.angle));
            ctx.stroke();

            // Head
            ctx.fillStyle = 'white';
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-60" />;
}
