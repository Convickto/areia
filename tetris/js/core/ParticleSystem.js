// Sistema de partículas para efeitos visuais
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 200;
        this.canvas = null;
    }

    initialize(canvas) {
        this.canvas = canvas;
    }

    createParticle(x, y, options) {
        if (this.particles.length >= this.maxParticles) return;

        const defaultOptions = {
            size: Math.random() * 4 + 2,
            color: '#00ffff',
            type: 'circle'
        };

        const finalOptions = Object.assign(defaultOptions, options || {});

        const particle = {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 2,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            size: finalOptions.size,
            color: finalOptions.color,
            type: finalOptions.type
        };

        this.particles.push(particle);
    }

    createLandingEffect(piece) {
        for (let i = 0; i < piece.blocks.length; i++) {
            const block = piece.blocks[i];
            const x = piece.x + block.x + 20 / 2;
            const y = piece.y + block.y + 20 / 2;
            
            for (let j = 0; j < 8; j++) {
                this.createParticle(x, y, {
                    color: piece.color,
                    size: Math.random() * 3 + 1
                });
            }
        }
    }

    createLineClearEffect(count) {
        const intensity = Math.min(count * 5, 20);
        
        for (let i = 0; i < intensity; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            
            this.createParticle(x, y, {
                color: '#ffff00',
                size: Math.random() * 6 + 3,
                type: 'star'
            });
        }
    }

    createLevelUpEffect() {
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            
            this.createParticle(x, y, {
                color: '#ff00ff',
                size: Math.random() * 8 + 4,
                type: 'sparkle'
            });
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Atualiza posição
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Aplica gravidade
            particle.vy += 0.1;
            
            // Atualiza vida
            particle.life -= particle.decay;
            
            // Remove partículas mortas
            if (particle.life <= 0 || 
                particle.x < 0 || particle.x > this.canvas.width ||
                particle.y < 0 || particle.y > this.canvas.height) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            ctx.globalAlpha = particle.life;
            
            switch (particle.type) {
                case 'circle':
                    this.renderCircle(ctx, particle);
                    break;
                case 'star':
                    this.renderStar(ctx, particle);
                    break;
                case 'sparkle':
                    this.renderSparkle(ctx, particle);
                    break;
            }
        }
        
        ctx.restore();
    }

    renderCircle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }

    renderStar(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = particle.x + Math.cos(angle) * particle.size;
            const y = particle.y + Math.sin(angle) * particle.size;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    renderSparkle(ctx, particle) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.size, particle.y);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.stroke();
    }

    resize(width, height) {
        // Remove partículas fora da tela
        this.particles = this.particles.filter(function(particle) {
            return particle.x >= 0 && particle.x <= width &&
                   particle.y >= 0 && particle.y <= height;
        });
    }

    clear() {
        this.particles = [];
    }
}
