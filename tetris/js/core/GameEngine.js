// Engine principal do jogo com otimizações de performance
import { SandSimulation } from './SandSimulation.js';
import { PieceManager } from './PieceManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { ScoreSystem } from './ScoreSystem.js';
import { ParticleSystem } from './ParticleSystem.js';

export class GameEngine {
    constructor(options) {
        this.audioManager = options.audioManager;
        this.uiManager = options.uiManager;
        this.config = options.config;
        
        // Sistemas do jogo
        this.sandSimulation = new SandSimulation(this.config);
        this.pieceManager = new PieceManager(this.config);
        this.collisionSystem = new CollisionSystem(this.config);
        this.scoreSystem = new ScoreSystem();
        this.particleSystem = new ParticleSystem();
        
        // Estado do jogo
        this.gameState = {
            isRunning: false,
            isPaused: false,
            currentLevel: 1,
            linesCleared: 0,
            combo: 0,
            lastUpdateTime: 0
        };
        
        // Performance
        this.frameCount = 0;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        
        // Canvas e contexto
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        
        this.initialize();
    }

    initialize() {
        this.setupCanvas();
        this.setupEventListeners();
        this.sandSimulation.initialize(this.canvas);
        this.particleSystem.initialize(this.canvas);
        this.collisionSystem.initialize(this.canvas);
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'game-canvas';
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false, 
            desynchronized: true 
        });
        
        // Otimizações de renderização
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        
        this.resizeCanvas();
        
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.canvas);
        }
    }

    setupEventListeners() {
        // Controles de teclado
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Controles de toque
        if (this.canvas) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
            
            // Controles de mouse
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }
    }

    start() {
        if (this.gameState.isRunning) return;
        
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        this.gameState.lastUpdateTime = performance.now();
        
        if (this.audioManager && this.audioManager.playBackgroundMusic) {
            this.audioManager.playBackgroundMusic();
        }
        
        this.gameLoop();
        console.log('Game started');
    }

    pause() {
        this.gameState.isPaused = true;
        if (this.audioManager && this.audioManager.pauseBackgroundMusic) {
            this.audioManager.pauseBackgroundMusic();
        }
    }

    resume() {
        this.gameState.isPaused = false;
        if (this.audioManager && this.audioManager.playBackgroundMusic) {
            this.audioManager.playBackgroundMusic();
        }
    }

    togglePause() {
        if (this.gameState.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    stop() {
        this.gameState.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.audioManager && this.audioManager.stopBackgroundMusic) {
            this.audioManager.stopBackgroundMusic();
        }
    }

    gameLoop() {
        if (!this.gameState.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.gameState.lastUpdateTime;

        if (deltaTime >= this.frameTime) {
            this.update(deltaTime);
            this.render();
            this.gameState.lastUpdateTime = currentTime;
            this.frameCount++;
        }

        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        if (this.gameState.isPaused) return;

        // Atualiza sistemas
        this.pieceManager.update(deltaTime);
        this.sandSimulation.update(deltaTime);
        this.particleSystem.update(deltaTime);
        
        // Verifica colisões
        this.checkCollisions();
        
        // Atualiza interface
        if (this.uiManager) {
            this.uiManager.updateScore(this.scoreSystem.getScore());
            this.uiManager.updateLevel(this.gameState.currentLevel);
        }
    }

    render() {
        if (!this.ctx) return;

        // Limpa canvas
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Renderiza sistemas
        this.sandSimulation.render(this.ctx);
        this.pieceManager.render(this.ctx);
        this.particleSystem.render(this.ctx);
    }

    checkCollisions() {
        // Implementação básica de colisão
        if (this.pieceManager.currentPiece) {
            const piece = this.pieceManager.currentPiece;
            
            // Verifica se a peça atingiu o fundo
            if (piece.y + piece.blocks.length * this.config.tileSize >= this.canvas.height) {
                this.landPiece();
            }
        }
    }

    landPiece() {
        if (!this.pieceManager.currentPiece) return;

        // Adiciona peça à simulação de areia
        this.sandSimulation.addPiece(this.pieceManager.currentPiece);
        
        // Cria efeito de partículas
        this.particleSystem.createLandingEffect(this.pieceManager.currentPiece);
        
        // Toca som
        if (this.audioManager && this.audioManager.playSound) {
            this.audioManager.playSound('land');
        }

        // Gera nova peça
        this.pieceManager.spawnNewPiece();
    }

    handleKeyDown(event) {
        if (this.gameState.isPaused) return;

        switch (event.code) {
            case 'ArrowLeft':
                this.pieceManager.moveLeft();
                break;
            case 'ArrowRight':
                this.pieceManager.moveRight();
                break;
            case 'ArrowDown':
                this.pieceManager.softDrop();
                break;
            case 'ArrowUp':
            case 'Space':
                this.pieceManager.rotate();
                break;
            case 'KeyZ':
                this.pieceManager.hardDrop();
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.code) {
            case 'ArrowDown':
                this.pieceManager.stopSoftDrop();
                break;
        }
    }

    handleTouchStart(event) {
        event.preventDefault();
        // Implementação básica de toque
    }

    handleTouchMove(event) {
        event.preventDefault();
        // Implementação básica de toque
    }

    handleTouchEnd(event) {
        event.preventDefault();
        // Implementação básica de toque
    }

    handleMouseDown(event) {
        // Implementação básica de mouse
    }

    handleMouseMove(event) {
        // Implementação básica de mouse
    }

    handleMouseUp(event) {
        // Implementação básica de mouse
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }

    handleResize() {
        this.resizeCanvas();
        this.sandSimulation.resize(this.canvas.width, this.canvas.height);
        this.particleSystem.resize(this.canvas.width, this.canvas.height);
    }
}

