/* ═══════════════════════════════════════════════════════════════
   PARTICLES.JS — Hero background: financial network visualization
   Nodes connected by edges, with floating math symbols
   ═══════════════════════════════════════════════════════════════ */

class ParticleNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.symbols = [];
    this.mouse = { x: null, y: null };
    this.dpr = window.devicePixelRatio || 1;

    this.config = {
      particleCount: 60,
      symbolCount: 8,
      connectionDistance: 140,
      mouseDistance: 180,
      baseSpeed: 0.3,
      colors: {
        particle: 'rgba(56, 189, 248, 0.6)',
        connection: 'rgba(56, 189, 248, 0.08)',
        mouseConnection: 'rgba(34, 211, 167, 0.15)',
        symbol: 'rgba(56, 189, 248, 0.12)'
      }
    };

    this.mathSymbols = ['∫', 'Σ', 'π', '∂', 'λ', '∞', 'Δ', 'θ', 'μ', 'σ', '∇', 'ε', 'φ', 'ψ'];

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.createSymbols();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.config.baseSpeed,
        vy: (Math.random() - 0.5) * this.config.baseSpeed,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }

  createSymbols() {
    this.symbols = [];
    for (let i = 0; i < this.config.symbolCount; i++) {
      this.symbols.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        symbol: this.mathSymbols[Math.floor(Math.random() * this.mathSymbols.length)],
        size: Math.random() * 18 + 14,
        opacity: Math.random() * 0.08 + 0.04,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.005
      });
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.resize();
        this.createParticles();
        this.createSymbols();
      }, 250);
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw symbols
    this.symbols.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.rotation += s.rotSpeed;

      if (s.x < -20) s.x = this.width + 20;
      if (s.x > this.width + 20) s.x = -20;
      if (s.y < -20) s.y = this.height + 20;
      if (s.y > this.height + 20) s.y = -20;

      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      this.ctx.rotate(s.rotation);
      this.ctx.font = `${s.size}px "Crimson Pro", serif`;
      this.ctx.fillStyle = this.config.colors.symbol;
      this.ctx.globalAlpha = s.opacity;
      this.ctx.fillText(s.symbol, 0, 0);
      this.ctx.restore();
    });

    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Mouse repulsion
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseDistance) {
          const force = (this.config.mouseDistance - dist) / this.config.mouseDistance;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }
      }

      // Speed limit
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 1) {
        p.vx = (p.vx / speed) * 1;
        p.vy = (p.vy / speed) * 1;
      }
    });

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.connectionDistance) {
          const opacity = 1 - (dist / this.config.connectionDistance);
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 * opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }

      // Mouse connections
      if (this.mouse.x !== null) {
        const dx = this.particles[i].x - this.mouse.x;
        const dy = this.particles[i].y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseDistance) {
          const opacity = 1 - (dist / this.config.mouseDistance);
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = `rgba(34, 211, 167, ${0.15 * opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(56, 189, 248, ${p.opacity})`;
      this.ctx.fill();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('hero-canvas')) {
    new ParticleNetwork('hero-canvas');
  }
});
