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
            console.log('🚀 Iniciando Areia Quântica...');
            
            // Inicializa monitor de performance
            this.performanceMonitor = new PerformanceMonitor();
            console.log('✅ Performance Monitor inicializado');
            
            // Inicializa sistema de áudio
            this.audioManager = new AudioManager();
            await this.audioManager.initialize();
            console.log('✅ Audio Manager inicializado');
            
            // Inicializa interface
            this.uiManager = new UIManager();
            await this.uiManager.initialize();
            console.log('✅ UI Manager inicializado');
            
            // Inicializa engine do jogo
            this.gameEngine = new GameEngine({
                audioManager: this.audioManager,
                uiManager: this.uiManager,
                config: Config
            });
            console.log('✅ Game Engine inicializado');
            
            // Configura eventos
            this.setupEventListeners();
            console.log('✅ Event Listeners configurados');
            
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
                this.gameEngine?.pause();
            } else {
                this.gameEngine?.resume();
            }
        });

        // Eventos de teclado globais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.gameEngine?.togglePause();
            }
        });

        // Eventos de resize otimizados
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.gameEngine?.handleResize();
            }, 100);
        });
    }

    start() {
        console.log('🎯 Iniciando jogo...');
        
        // Remove tela de carregamento
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) {
                    gameContainer.style.display = 'block';
                }
            }, 500);
        }

        // Inicia o loop do jogo
        if (this.gameEngine) {
            this.gameEngine.start();
        }
    }

    showErrorScreen(error) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = '<h2>Erro ao carregar</h2><p>' + error.message + '</p><button onclick="location.reload()">Tentar Novamente</button>';
        }
    }
}

// Inicializa o jogo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, iniciando jogo...');
    const game = new QuantumSandGame();
    game.initialize();
});

// Exporta para uso global se necessário
window.QuantumSandGame = QuantumSandGame;
