// Sistema de simulação de areia otimizado
export class SandSimulation {
    constructor(config) {
        this.config = config;
        this.grid = [];
        this.cols = 0;
        this.rows = 0;
        this.cellSize = 8;
        this.updateInterval = 50;
        this.lastUpdate = 0;
        this.isInitialized = false;
    }

    initialize(canvas) {
        this.canvas = canvas;
        this.resize(canvas.width, canvas.height);
        this.isInitialized = true;
    }

    resize(width, height) {
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);
        this.grid = Array.from({ length: this.rows }, () => 
            Array(this.cols).fill(null)
        );
    }

    update(deltaTime) {
        if (!this.isInitialized) return;

        const currentTime = performance.now();
        if (currentTime - this.lastUpdate < this.updateInterval) return;

        this.lastUpdate = currentTime;
        this.simulateSandPhysics();
    }

    simulateSandPhysics() {
        // Simulação otimizada de física de areia
        for (let y = this.rows - 1; y >= 0; y--) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (cell === null) continue;

                // Tenta cair
                if (y + 1 < this.rows && this.grid[y + 1][x] === null) {
                    this.grid[y + 1][x] = cell;
                    this.grid[y][x] = null;
                    continue;
                }

                // Tenta rolar para os lados
                const rollDirections = Math.random() < 0.5 ? [-1, 1] : [1, -1];
                for (const dir of rollDirections) {
                    const newX = x + dir;
                    if (newX >= 0 && newX < this.cols && 
                        y + 1 < this.rows && this.grid[y + 1][newX] === null) {
                        this.grid[y + 1][newX] = cell;
                        this.grid[y][x] = null;
                        break;
                    }
                }
            }
        }
    }

    addPiece(piece) {
        if (!this.isInitialized) return;

        for (const block of piece.blocks) {
            const startX = piece.x + block.x;
            const startY = piece.y + block.y;

            // Converte peça em células de areia
            for (let y = 0; y < this.config.tileSize; y += this.cellSize) {
                for (let x = 0; x < this.config.tileSize; x += this.cellSize) {
                    const gridX = Math.floor((startX + x) / this.cellSize);
                    const gridY = Math.floor((startY + y) / this.cellSize);

                    if (gridX >= 0 && gridX < this.cols && 
                        gridY >= 0 && gridY < this.rows) {
                        this.grid[gridY][gridX] = piece.color;
                    }
                }
            }
        }
    }

    checkAndClearLines() {
        if (!this.isInitialized) return 0;

        let linesCleared = 0;
        const visited = Array.from({ length: this.rows }, () => 
            Array(this.cols).fill(false)
        );

        // Encontra clusters conectados
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] !== null && !visited[y][x]) {
                    const cluster = this.findCluster(x, y, visited);
                    
                    if (this.isCompleteLine(cluster)) {
                        this.clearCluster(cluster);
                        linesCleared++;
                    }
                }
            }
        }

        return linesCleared;
    }

    findCluster(startX, startY, visited) {
        const cluster = [];
        const queue = [{ x: startX, y: startY }];
        const color = this.grid[startY][startX];

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (visited[y][x] || this.grid[y][x] !== color) continue;
            
            visited[y][x] = true;
            cluster.push({ x, y });

            // Adiciona vizinhos
            const neighbors = [
                { x: x - 1, y }, { x: x + 1, y },
                { x, y: y - 1 }, { x, y: y + 1 },
                { x: x - 1, y: y - 1 }, { x: x + 1, y: y - 1 },
                { x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 }
            ];

            for (const neighbor of neighbors) {
                if (neighbor.x >= 0 && neighbor.x < this.cols &&
                    neighbor.y >= 0 && neighbor.y < this.rows &&
                    !visited[neighbor.y][neighbor.x] &&
                    this.grid[neighbor.y][neighbor.x] === color) {
                    queue.push(neighbor);
                }
            }
        }

        return cluster;
    }

    isCompleteLine(cluster) {
        if (cluster.length === 0) return false;

        const minX = Math.min(...cluster.map(p => p.x));
        const maxX = Math.max(...cluster.map(p => p.x));
        const minY = Math.min(...cluster.map(p => p.y));
        const maxY = Math.max(...cluster.map(p => p.y));

        // Verifica se o cluster forma uma linha completa
        return (maxX - minX + 1) >= this.cols * 0.8; // 80% da largura
    }

    clearCluster(cluster) {
        for (const { x, y } of cluster) {
            this.grid[y][x] = null;
        }
    }

    isGameOver() {
        // Verifica se há areia muito próxima ao topo
        for (let x = 0; x < this.cols; x++) {
            if (this.grid[0][x] !== null || this.grid[1][x] !== null) {
                return true;
            }
        }
        return false;
    }

    render(ctx) {
        if (!this.isInitialized) return;

        ctx.save();
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (cell === null) continue;

                const centerX = x * this.cellSize + this.cellSize / 2;
                const centerY = y * this.cellSize + this.cellSize / 2;
                const radius = this.cellSize / 2;

                // Desenha célula com gradiente
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, cell);
                gradient.addColorStop(1, this.darkenColor(cell, 0.3));

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();

                // Adiciona brilho
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(centerX - 1, centerY - 1, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    reset() {
        this.grid = Array.from({ length: this.rows }, () => 
            Array(this.cols).fill(null)
        );
    }
}
