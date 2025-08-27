// Gerenciador de peças com física avançada
export class PieceManager {
    constructor(config) {
        this.config = config;
        this.currentPiece = null;
        this.nextPiece = null;
        this.pieces = config.pieces;
        this.colors = [
            '#00ffff', '#ff00ff', '#00ff00', 
            '#ffff00', '#ff4500', '#8A2BE2', '#ADFF2F'
        ];
        this.currentSpeed = 1.0;
        this.softDropActive = false;
    }

    spawnNewPiece() {
        if (this.nextPiece === null) {
            this.generateNextPiece();
        }

        this.currentPiece = this.nextPiece;
        this.generateNextPiece();

        // Posiciona a peça no topo central
        const canvas = document.getElementById('game-canvas');
        const startX = Math.floor((canvas.width / 2 - (this.currentPiece.blocks.length / 2 * this.config.tileSize)) / this.config.tileSize) * this.config.tileSize;
        
        this.currentPiece.x = startX;
        this.currentPiece.y = 0;
        this.currentPiece.velocityY = 0;
        this.currentPiece.grounded = false;

        return this.currentPiece;
    }

    generateNextPiece() {
        const types = Object.keys(this.pieces);
        const type = types[Math.floor(Math.random() * types.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];

        this.nextPiece = {
            type,
            color,
            blocks: this.pieces[type].map(([dx, dy]) => ({ 
                x: dx * this.config.tileSize, 
                y: dy * this.config.tileSize 
            })),
            rotation: 0
        };
    }

    update(deltaTime) {
        if (!this.currentPiece) return;

        // Aplica gravidade
        const gravity = this.softDropActive ? this.config.fastGravity : this.config.gravity;
        this.currentPiece.velocityY += gravity * deltaTime;
        
        // Move a peça para baixo
        this.currentPiece.y += this.currentPiece.velocityY;
    }

    moveLeft() {
        if (!this.currentPiece) return;
        this.currentPiece.x -= this.config.tileSize;
    }

    moveRight() {
        if (!this.currentPiece) return;
        this.currentPiece.x += this.config.tileSize;
    }

    rotate() {
        if (!this.currentPiece) return;

        const originalBlocks = [...this.currentPiece.blocks];
        const centerBlock = this.currentPiece.blocks[1] || { x: 0, y: 0 };

        // Rotação 90 graus no sentido horário
        const rotatedBlocks = originalBlocks.map(block => {
            const relativeX = block.x - centerBlock.x;
            const relativeY = block.y - centerBlock.y;
            return {
                x: centerBlock.x - relativeY,
                y: centerBlock.y + relativeX
            };
        });

        this.currentPiece.blocks = rotatedBlocks;
        this.currentPiece.rotation = (this.currentPiece.rotation + 90) % 360;
    }

    softDrop() {
        this.softDropActive = true;
    }

    stopSoftDrop() {
        this.softDropActive = false;
    }

    hardDrop() {
        if (!this.currentPiece) return;
        
        // Move a peça para baixo até colidir
        // Esta implementação será melhorada quando o CollisionSystem estiver disponível
        this.currentPiece.y += this.config.tileSize * 10; // Move rapidamente para baixo
    }

    setSpeed(level) {
        this.currentSpeed = 1 + (level - 1) * 0.2;
    }

    render(ctx) {
        if (!this.currentPiece) return;

        ctx.save();
        
        // Desenha a peça atual
        this.renderPiece(ctx, this.currentPiece);
        
        // Desenha preview da próxima peça
        if (this.nextPiece) {
            this.renderNextPiece(ctx);
        }

        ctx.restore();
    }

    renderPiece(ctx, piece) {
        ctx.fillStyle = piece.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;

        for (const block of piece.blocks) {
            const x = piece.x + block.x;
            const y = piece.y + block.y;

            // Desenha bloco com gradiente
            const gradient = ctx.createLinearGradient(x, y, x + this.config.tileSize, y + this.config.tileSize);
            gradient.addColorStop(0, piece.color);
            gradient.addColorStop(1, this.darkenColor(piece.color, 0.3));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.rect(x, y, this.config.tileSize, this.config.tileSize);
            ctx.fill();
            ctx.stroke();

            // Adiciona brilho
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.rect(x + 2, y + 2, this.config.tileSize - 4, this.config.tileSize - 4);
            ctx.fill();
        }
    }

    renderNextPiece(ctx) {
        const previewX = 20;
        const previewY = 20;
        const previewSize = this.config.tileSize * 0.8;

        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(previewX - 10, previewY - 10, 120, 80);

        for (const block of this.nextPiece.blocks) {
            const x = previewX + block.x * 0.8;
            const y = previewY + block.y * 0.8;

            ctx.fillStyle = this.nextPiece.color;
            ctx.beginPath();
            ctx.rect(x, y, previewSize, previewSize);
            ctx.fill();
        }
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
}
```

```

