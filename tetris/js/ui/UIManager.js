// Gerenciador de interface do usuário simplificado
export class UIManager {
    constructor() {
        this.elements = {};
        this.modals = {};
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('UI Manager: Iniciando...');
            this.createUI();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('UI Manager: Inicializado com sucesso');
        } catch (error) {
            console.error('UI Manager: Erro na inicialização:', error);
            this.isInitialized = false;
        }
    }

    createUI() {
        const container = document.getElementById('game-container');
        if (!container) {
            console.warn('UI Manager: Container não encontrado');
            return;
        }
        
        // Cria interface básica do jogo
        const uiHTML = '<div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px; color: #00e6e6;"><div>Score: <span id="score-value">0</span></div><div>Level: <span id="level-value">1</span></div></div><div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;"><button id="pause-btn" style="background: #00e6e6; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Pausar</button><button id="restart-btn" style="background: #e600e6; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Reiniciar</button></div>';
        
        container.insertAdjacentHTML('beforeend', uiHTML);

        // Armazena referências
        this.elements = {
            scoreValue: document.getElementById('score-value'),
            levelValue: document.getElementById('level-value'),
            pauseBtn: document.getElementById('pause-btn'),
            restartBtn: document.getElementById('restart-btn')
        };
    }

    setupEventListeners() {
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('gamePause'));
            });
        }

        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('gameRestart'));
            });
        }
    }

    updateScore(score) {
        if (this.elements.scoreValue) {
            this.elements.scoreValue.textContent = score.toLocaleString();
        }
    }

    updateLevel(level) {
        if (this.elements.levelValue) {
            this.elements.levelValue.textContent = level;
        }
    }

    updateCombo(combo) {
        console.log('Combo:', combo);
    }

    showLevelUp(level) {
        console.log('Level Up:', level);
    }

    showGameOver(score) {
        console.log('Game Over:', score);
        alert('Game Over! Pontuação: ' + score);
    }

    showNotification(message, type = 'info') {
        console.log('Notification [' + type + ']:', message);
    }

    showModal(id, options) {
        console.log('Modal', id + ':', options);
    }

    closeModal(id) {
        console.log('Closing modal:', id);
    }

    handleModalAction(action) {
        console.log('Modal action:', action);
    }

    showSettingsModal() {
        console.log('Settings modal requested');
    }

    render(ctx) {
        // Renderização adicional no canvas se necessário
    }
}
