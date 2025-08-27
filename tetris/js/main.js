// Módulo principal - ponto de entrada da aplicação
import { GameEngine } from './core/GameEngine.js';
import { AudioManager } from './core/AudioManager.js';
import { UIManager } from './ui/UIManager.js';
import { Config } from './config/Config.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';

class QuantumSandGame {
    constructor() {
        this.gameEngine = null;
        this.audioManager = null;
        this.uiManager = null;
        this.performanceMonitor = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Inicializa monitor de performance
            this.performanceMonitor = new PerformanceMonitor();
            
            // Inicializa sistema de áudio
            this.audioManager = new AudioManager();
            await this.audioManager.initialize();
            
            // Inicializa interface
            this.uiManager = new UIManager();
            await this.uiManager.initialize();
            
            // Inicializa engine do jogo
            this.gameEngine = new GameEngine({
                audioManager: this.audioManager,
                uiManager: this.uiManager,
                config: Config
            });
            
            // Configura eventos
            this.setupEventListeners();
            
            // Inicia o jogo
            this.start();
            
            this.isInitialized = true;
            console.log('🎮 Areia Quântica inicializada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showErrorScreen(error);
        }
    }

    setupEventListeners() {
        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.gameEngine.pause();
            } else {
                this.gameEngine.resume();
            }
        });

        // Eventos de teclado globais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.gameEngine.togglePause();
            }
        });

        // Eventos de resize otimizados
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.gameEngine.handleResize();
            }, 100);
        });
    }

    start() {
        // Remove tela de carregamento
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
        }, 500);

        // Inicia o loop do jogo
        this.gameEngine.start();
    }

    showErrorScreen(error) {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.innerHTML = `
            <h2>Erro ao carregar</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()">Tentar Novamente</button>
        `;
    }
}

// Inicializa o jogo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const game = new QuantumSandGame();
    game.initialize();
});

// Exporta para uso global se necessário
window.QuantumSandGame = QuantumSandGame;
```

```javascript:js/core/GameEngine.js
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
        
        this.audioManager.playBackgroundMusic();
        this.gameLoop();
        
        console.log('🚀 Jogo iniciado');
    }

    pause() {
        this.gameState.isPaused = true;
        this.audioManager.pauseBackgroundMusic();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resume() {
        if (!this.gameState.isRunning) return;
        
        this.gameState.isPaused = false;
        this.gameState.lastUpdateTime = performance.now();
        this.audioManager.resumeBackgroundMusic();
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
            if (this.collisionSystem.checkCollision(this.pieceManager.currentPiece)) {
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
        this.uiManager.updateScore(this.scoreSystem.getScore());
        this.uiManager.updateLevel(this.gameState.currentLevel);
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
        this.uiManager.render(this.ctx);
    }

    handlePieceLanded() {
        // Adiciona peça à simulação de areia
        this.sandSimulation.addPiece(this.pieceManager.currentPiece);
        
        // Efeitos visuais e sonoros
        this.particleSystem.createLandingEffect(this.pieceManager.currentPiece);
        this.audioManager.playSound('piece-land');
        
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
        this.audioManager.playSound('line-clear');
        
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
        this.audioManager.playSound('level-up');
        this.uiManager.showLevelUp(newLevel);
    }

    gameOver() {
        this.gameState.isRunning = false;
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playSound('game-over');
        
        this.uiManager.showGameOver(this.scoreSystem.getScore());
        
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
        // Implementação de controles touch
    }

    handleTouchMove(e) {
        e.preventDefault();
        // Implementação de controles touch
    }

    handleTouchEnd(e) {
        e.preventDefault();
        // Implementação de controles touch
    }

    handleMouseDown(e) {
        // Implementação de controles mouse
    }

    handleMouseMove(e) {
        // Implementação de controles mouse
    }

    handleMouseUp(e) {
        // Implementação de controles mouse
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
```

```javascript:js/core/AudioManager.js
// Sistema de áudio profissional com Web Audio API
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = new Map();
        this.backgroundMusic = null;
        this.isInitialized = false;
        this.volume = 0.7;
        this.musicVolume = 0.5;
    }

    async initialize() {
        try {
            // Cria contexto de áudio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;

            // Carrega sons
            await this.loadSounds();
            
            this.isInitialized = true;
            console.log('🎵 Sistema de áudio inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar áudio:', error);
        }
    }

    async loadSounds() {
        const soundFiles = {
            'piece-move': 'audio/pop.mp3',
            'piece-land': 'audio/pop.mp3',
            'line-clear': 'audio/pop.mp3',
            'level-up': 'audio/pop.mp3',
            'game-over': 'audio/pop.mp3',
            'background': 'audio/bg-sound.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds.set(name, audioBuffer);
            } catch (error) {
                console.warn(`⚠️ Não foi possível carregar: ${path}`);
            }
        }
    }

    playSound(name, options = {}) {
        if (!this.isInitialized || !this.sounds.has(name)) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds.get(name);
        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Configurações de áudio
        if (options.volume !== undefined) {
            gainNode.gain.value = options.volume;
        }
        
        if (options.pitch !== undefined) {
            source.playbackRate.value = options.pitch;
        }

        source.start();
        
        // Limpa recursos após tocar
        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
        };
    }

    async playBackgroundMusic() {
        if (!this.isInitialized || !this.sounds.has('background')) return;

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sounds.get('background');
            source.loop = true;
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            gainNode.gain.value = this.musicVolume;
            
            source.start();
            this.backgroundMusic = { source, gainNode };
            
        } catch (error) {
            console.warn('⚠️ Erro ao tocar música de fundo:', error);
        }
    }

    pauseBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.source.stop();
            this.backgroundMusic = null;
        }
    }

    resumeBackgroundMusic() {
        if (!this.backgroundMusic) {
            this.playBackgroundMusic();
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.source.stop();
            this.backgroundMusic = null;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.gainNode.gain.value = this.musicVolume;
        }
    }

    // Efeitos de áudio especiais
    createComboSound(combo) {
        const pitch = 1 + (combo * 0.1);
        this.playSound('line-clear', { pitch, volume: 0.8 });
    }

    createLevelUpSound() {
        // Sequência de sons para level up
        setTimeout(() => this.playSound('level-up', { pitch: 0.8 }), 0);
        setTimeout(() => this.playSound('level-up', { pitch: 1.0 }), 100);
        setTimeout(() => this.playSound('level-up', { pitch: 1.2 }), 200);
    }
}
```

```css:styles/main.css
/* CSS principal com design profissional e responsivo */

/* Importação de fontes */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

/* Variáveis CSS avançadas */
:root {
    /* Cores principais */
    --bg-start: #0a0a2a;
    --bg-end: #1a0a3a;
    --primary-text: #00e6e6;
    --secondary-text: #e600e6;
    --accent-color: #00ffff;
    --warning-color: #ff6b35;
    --success-color: #4ecdc4;
    
    /* Neomorfismo */
    --neomorphic-bg: #15082d;
    --neomorphic-shadow-dark: rgba(0, 0, 0, 0.4);
    --neomorphic-shadow-light: rgba(255, 255, 255, 0.08);
    
    /* Gradientes */
    --gradient-primary: linear-gradient(135deg, var(--primary-text), var(--accent-color));
    --gradient-secondary: linear-gradient(135deg, var(--secondary-text), #ff6b9d);
    
    /* Animações */
    --transition-fast: 0.15s ease-out;
    --transition-normal: 0.3s ease-out;
    --transition-slow: 0.5s ease-out;
    
    /* Breakpoints */
    --mobile: 480px;
    --tablet: 768px;
    --desktop: 1024px;
}

/* Reset e base */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    scroll-behavior: smooth;
}

body {
    background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
    font-family: 'Space Mono', monospace;
    color: var(--primary-text);
    overflow: hidden;
    user-select: none;
    touch-action: manipulation;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Container principal */
#game-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}

/* Canvas do jogo */
#game-canvas {
    background: #0d0d0d;
    border: 3px solid var(--accent-color);
    border-radius: 20px;
    box-shadow: 
        0 0 30px rgba(0, 255, 255, 0.3),
        inset 0 0 20px rgba(0, 255, 255, 0.1);
    max-width: 100%;
    max-height: 100%;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
}

/* Interface do jogo */
.game-ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}

.ui-panel {
    position: absolute;
    background: rgba(21, 8, 45, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 1rem;
    box-shadow: 
        5px 5px 15px var(--neomorphic-shadow-dark),
        -5px -5px 15px var(--neomorphic-shadow-light);
    pointer-events: auto;
    border: 1px solid rgba(0, 255, 255, 0.2);
}

.score-panel {
    top: 1rem;
    right: 1rem;
    min-width: 120px;
    text-align: center;
}

.level-panel {
    top: 1rem;
    left: 1rem;
    min-width: 100px;
    text-align: center;
}

.controls-panel {
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
}

/* Botões */
.btn {
    background: var(--neomorphic-bg);
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    color: var(--primary-text);
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: 
        3px 3px 8px var(--neomorphic-shadow-dark),
        -3px -3px 8px var(--neomorphic-shadow-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 
        0 8px 20px rgba(0, 255, 255, 0.3),
        3px 3px 8px var(--neomorphic-shadow-dark);
}

.btn:active {
    transform: translateY(0);
    box-shadow: 
        inset 2px 2px 5px var(--neomorphic-shadow-dark),
        inset -2px -2px 5px var(--neomorphic-shadow-light);
}

.btn-primary {
    background: var(--gradient-primary);
    color: #000;
}

.btn-secondary {
    background: var(--gradient-secondary);
    color: #fff;
}

/* Texto e tipografia */
.ui-text {
    font-size: 1.1rem;
    font-weight: 700;
    text-shadow: 0 0 10px currentColor;
    margin-bottom: 0.5rem;
}

.ui-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent-color);
    text-shadow: 0 0 15px var(--accent-color);
}

/* Animações */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

@keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.3); }
    50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.6); }
}

@keyframes slideIn {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Classes de animação */
.animate-pulse {
    animation: pulse 2s infinite;
}

.animate-glow {
    animation: glow 2s infinite;
}

.animate-slide-in {
    animation: slideIn 0.5s ease-out;
}

.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}

/* Modal e overlays */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
}

.modal {
    background: var(--neomorphic-bg);
    border-radius: 20px;
    padding: 2rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.5),
        0 0 30px rgba(0, 255, 255, 0.2);
    border: 2px solid var(--accent-color);
    animation: slideIn 0.5s ease-out;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-align: center;
    color: var(--accent-color);
}

.modal-content {
    margin-bottom: 1.5rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

/* Responsividade */
@media (max-width: 480px) {
    .ui-panel {
        padding: 0.75rem;
        font-size: 0.9rem;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
    }
    
    .controls-panel {
        gap: 0.5rem;
    }
    
    .modal {
        padding: 1.5rem;
        margin: 1rem;
    }
}

@media (max-width: 768px) {
    .score-panel,
    .level-panel {
        min-width: 100px;
    }
}

/* Utilitários */
.hidden {
    display: none !important;
}

.visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

/* Scrollbar customizada */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: var(--neomorphic-bg);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: var(--accent-color);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--primary-text);
}
```

```javascript:js/core/SandSimulation.js
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
```

```javascript:js/config/Config.js
// Configurações centralizadas do jogo
export const Config = {
    // Dimensões e física
    tileSize: 20,
    sandCellSize: 8,
    gravity: 0.01,
    fastGravity: 5,
    
    // Cores
    colors: {
        primary: '#00e6e6',
        secondary: '#e600e6',
        accent: '#00ffff',
        background: '#0d0d0d',
        neomorphic: '#15082d'
    },
    
    // Peças
    pieces: {
        T: [[0,0], [1,0], [2,0], [1,1]],
        L: [[0,0], [0,1], [0,2], [1,2]],
        J: [[1,0], [1,1], [1,2], [0,2]],
        I: [[0,0], [0,1], [0,2], [0,3]],
        O: [[0,0], [1,0], [0,1], [1,1]],
        S: [[1,0], [2,0], [0,1], [1,1]],
        Z: [[0,0], [1,0], [1,1], [2,1]]
    },
    
    // Pontuação
    scoring: {
        lineClear: 100,
        comboMultiplier: 1.5,
        levelUpLines: 10
    },
    
    // Performance
    performance: {
        targetFPS: 60,
        sandUpdateInterval: 50,
        particleLimit: 200
    },
    
    // Áudio
    audio: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.8
    },
    
    // Dificuldade
    difficulty: {
        easy: {
            colors: 3,
            speed: 1.0,
            gravity: 0.01
        },
        medium: {
            colors: 4,
            speed: 1.2,
            gravity: 0.015
        },
        hard: {
            colors: 5,
            speed: 1.5,
            gravity: 0.02
        }
    }
};
```

```javascript:js/utils/PerformanceMonitor.js
// Monitor de performance para otimização
export class PerformanceMonitor {
    constructor() {
        this.fpsHistory = [];
        this.frameTimes = [];
        this.maxHistorySize = 60;
        this.isMonitoring = false;
    }

    start() {
        this.isMonitoring = true;
        this.monitorFrame();
    }

    stop() {
        this.isMonitoring = false;
    }

    monitorFrame() {
        if (!this.isMonitoring) return;

        const now = performance.now();
        this.frameTimes.push(now);

        if (this.frameTimes.length > 2) {
            const frameTime = now - this.frameTimes[this.frameTimes.length - 2];
            const fps = 1000 / frameTime;
            
            this.fpsHistory.push(fps);
            if (this.fpsHistory.length > this.maxHistorySize) {
                this.fpsHistory.shift();
            }
        }

        requestAnimationFrame(() => this.monitorFrame());
    }

    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 0;
        return this
