// Engine principal do jogo com otimizações de performance
import { SandSimulation } from './SandSimulation.js';
import { PieceManager } from './PieceManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { ScoreSystem } from './ScoreSystem.js';
import { ParticleSystem } from './ParticleSystem.js';

export class GameEngine {
    constructor({ audioManager, uiManager, config }) {
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.config = config;
        
        // Sistemas do jogo
        this.sandSimulation = new SandSimulation(config);
        this.pieceManager = new PieceManager(config);
        this.collisionSystem = new CollisionSystem(config);
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
        document.getElementById('game-container').appendChild(this.canvas);
    }

    setupEventListeners() {
        // Controles de teclado
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Controles de toque
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Controles de mouse
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    start() {
        if (this.gameState.isRunning) return;
        
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        this.gameState.lastUpdateTime = performance.now();
        
        if (this.audioManager) {
            this.audioManager.playBackgroundMusic();
        }
        this.gameLoop();
        
        console.log('🚀 Jogo iniciado');
    }

    pause() {
        this.gameState.isPaused = true;
        if (this.audioManager) {
            this.audioManager.pauseBackgroundMusic();
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resume() {
        if (!this.gameState.isRunning) return;
        
        this.gameState.isPaused = false;
        this.gameState.lastUpdateTime = performance.now();
        if (this.audioManager) {
            this.audioManager.resumeBackgroundMusic();
        }
        this.gameLoop();
    }

    togglePause() {
        if (this.gameState.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;

        const deltaTime = currentTime - this.gameState.lastUpdateTime;
        
        // Controle de FPS para performance
        if (deltaTime >= this.frameTime) {
            this.update(deltaTime);
            this.render();
            this.gameState.lastUpdateTime = currentTime;
        }

        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Atualiza simulação de areia
        this.sandSimulation.update(deltaTime);
        
        // Atualiza peça atual
        if (this.pieceManager.currentPiece) {
            this.pieceManager.update(deltaTime);
            
            // Verifica colisões
            if (this.collisionSystem.checkCollision(this.pieceManager.currentPiece, this.sandSimulation.grid)) {
                this.handlePieceLanded();
            }
        } else {
            this.pieceManager.spawnNewPiece();
        }
        
        // Atualiza sistema de partículas
        this.particleSystem.update(deltaTime);
        
        // Verifica linhas completas
        const linesCleared = this.sandSimulation.checkAndClearLines();
        if (linesCleared > 0) {
            this.handleLinesCleared(linesCleared);
        }
        
        // Atualiza interface
        if (this.uiManager) {
            this.uiManager.updateScore(this.scoreSystem.getScore());
            this.uiManager.updateLevel(this.gameState.currentLevel);
            this.uiManager.updateCombo(this.gameState.combo);
        }
    }

    render() {
        // Limpa canvas
        this.ctx.fillStyle = '#0d0d0d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderiza grade de areia
        this.sandSimulation.render(this.ctx);
        
        // Renderiza peça atual
        if (this.pieceManager.currentPiece) {
            this.pieceManager.render(this.ctx);
        }
        
        // Renderiza partículas
        this.particleSystem.render(this.ctx);
        
        // Renderiza interface
        if (this.uiManager) {
            this.uiManager.render(this.ctx);
        }
    }

    handlePieceLanded() {
        // Adiciona peça à simulação de areia
        this.sandSimulation.addPiece(this.pieceManager.currentPiece);
        
        // Efeitos visuais e sonoros
        this.particleSystem.createLandingEffect(this.pieceManager.currentPiece);
        if (this.audioManager) {
            this.audioManager.playSound('piece-land');
        }
        
        // Reseta peça atual
        this.pieceManager.currentPiece = null;
        
        // Verifica game over
        if (this.sandSimulation.isGameOver()) {
            this.gameOver();
        }
    }

    handleLinesCleared(count) {
        // Atualiza pontuação
        const score = this.scoreSystem.addLinesCleared(count, this.gameState.combo);
        this.gameState.combo++;
        
        // Efeitos visuais
        this.particleSystem.createLineClearEffect(count);
        if (this.audioManager) {
            this.audioManager.playSound('line-clear');
        }
        
        // Verifica level up
        const newLevel = Math.floor(this.scoreSystem.getLinesCleared() / 10) + 1;
        if (newLevel > this.gameState.currentLevel) {
            this.levelUp(newLevel);
        }
    }

    levelUp(newLevel) {
        this.gameState.currentLevel = newLevel;
        this.gameState.combo = 0;
        
        // Aumenta velocidade
        this.pieceManager.setSpeed(newLevel);
        
        // Efeitos
        this.particleSystem.createLevelUpEffect();
        if (this.audioManager) {
            this.audioManager.playSound('level-up');
        }
        if (this.uiManager) {
            this.uiManager.showLevelUp(newLevel);
        }
    }

    gameOver() {
        this.gameState.isRunning = false;
        if (this.audioManager) {
            this.audioManager.stopBackgroundMusic();
            this.audioManager.playSound('game-over');
        }
        
        if (this.uiManager) {
            this.uiManager.showGameOver(this.scoreSystem.getScore());
        }
        
        console.log('💀 Game Over - Score:', this.scoreSystem.getScore());
    }

    // Event handlers
    handleKeyDown(e) {
        if (this.gameState.isPaused) return;
        
        switch (e.code) {
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

    handleKeyUp(e) {
        if (e.code === 'ArrowDown') {
            this.pieceManager.stopSoftDrop();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        // Implementação básica de controles touch
    }

    handleTouchMove(e) {
        e.preventDefault();
        // Implementação básica de controles touch
    }

    handleTouchEnd(e) {
        e.preventDefault();
        // Implementação básica de controles touch
    }

    handleMouseDown(e) {
        // Implementação básica de controles mouse
    }

    handleMouseMove(e) {
        // Implementação básica de controles mouse
    }

    handleMouseUp(e) {
        // Implementação básica de controles mouse
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const containerRect = container.getBoundingClientRect();
        
        // Mantém proporção 3:5
        const aspectRatio = 3 / 5;
        let width = containerRect.width * 0.9;
        let height = width / aspectRatio;
        
        if (height > containerRect.height * 0.9) {
            height = containerRect.height * 0.9;
            width = height * aspectRatio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Atualiza sistemas
        this.sandSimulation.resize(width, height);
        this.particleSystem.resize(width, height);
    }

    handleResize() {
        this.resizeCanvas();
    }
}

