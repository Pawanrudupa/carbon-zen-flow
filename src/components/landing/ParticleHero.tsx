import { useEffect, useRef } from "react";

const ParticleHero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const mouse = { x: -9999, y: -9999 };
    const MOUSE_RADIUS = 150;
    const ATTRACT_FORCE = 0.04;
    const REPEL_FORCE = 0.08;
    const FRICTION = 0.96;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; baseSize: number; baseOpacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    for (let i = 0; i < 120; i++) {
      const size = Math.random() * 2 + 0.5;
      const opacity = Math.random() * 0.2 + 0.05;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size,
        opacity,
        baseSize: size,
        baseOpacity: opacity,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const norm = 1 - dist / MOUSE_RADIUS;
          // Attract when far-ish, repel when very close
          if (dist > 40) {
            p.vx += (dx / dist) * ATTRACT_FORCE * norm;
            p.vy += (dy / dist) * ATTRACT_FORCE * norm;
          } else {
            p.vx -= (dx / dist) * REPEL_FORCE * norm;
            p.vy -= (dy / dist) * REPEL_FORCE * norm;
          }
          // Glow up near cursor
          p.size = p.baseSize + norm * 3;
          p.opacity = Math.min(p.baseOpacity + norm * 0.5, 0.8);
        } else {
          p.size += (p.baseSize - p.size) * 0.05;
          p.opacity += (p.baseOpacity - p.opacity) * 0.05;
        }

        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.05 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

export default ParticleHero;
