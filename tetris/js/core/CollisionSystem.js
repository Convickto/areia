// Sistema de colisão otimizado
export class CollisionSystem {
    constructor(config) {
        this.config = config;
        this.canvas = null;
    }

    initialize(canvas) {
        this.canvas = canvas;
    }

    checkCollision(piece, sandGrid = null) {
        if (!piece || !this.canvas) return false;

        for (const block of piece.blocks) {
            const blockX = piece.x + block.x;
            const blockY = piece.y + block.y;

            // Colisão com bordas do canvas
            if (blockX < 0 || 
                blockX + this.config.tileSize > this.canvas.width ||
                blockY + this.config.tileSize > this.canvas.height) {
                return true;
            }

            // Colisão com areia (se fornecida)
            if (sandGrid) {
                if (this.checkSandCollision(blockX, blockY, sandGrid)) {
                    return true;
                }
            }
        }

        return false;
    }

    checkSandCollision(blockX, blockY, sandGrid) {
        const cellSize = this.config.sandCellSize;
        
        for (let y = 0; y < this.config.tileSize; y += cellSize) {
            for (let x = 0; x < this.config.tileSize; x += cellSize) {
                const gridX = Math.floor((blockX + x) / cellSize);
                const gridY = Math.floor((blockY + y) / cellSize);

                if (gridX >= 0 && gridX < sandGrid[0].length &&
                    gridY >= 0 && gridY < sandGrid.length &&
                    sandGrid[gridY][gridX] !== null) {
                    return true;
                }
            }
        }

        return false;
    }

    // Sistema de "kick" para rotação (SRS simplificado)
    checkRotationKick(piece, sandGrid) {
        const kicks = [
            { x: 0, y: 0 },
            { x: this.config.tileSize, y: 0 },
            { x: -this.config.tileSize, y: 0 },
            { x: 0, y: -this.config.tileSize },
            { x: this.config.tileSize, y: -this.config.tileSize },
            { x: -this.config.tileSize, y: -this.config.tileSize }
        ];

        for (const kick of kicks) {
            const testPiece = {
                ...piece,
                x: piece.x + kick.x,
                y: piece.y + kick.y
            };

            if (!this.checkCollision(testPiece, sandGrid)) {
                return kick;
            }
        }

        return null;
    }
}
