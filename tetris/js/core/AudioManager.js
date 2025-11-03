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
            // Continua sem áudio se houver erro
            this.isInitialized = false;
        }
    }

    async loadSounds() {
        const basePath = './audio/';
        const soundFiles = {
            'piece-move': basePath + 'pop.mp3',
            'piece-land': basePath + 'pop.mp3',
            'line-clear': basePath + 'pop.mp3',
            'level-up': basePath + 'pop.mp3',
            'game-over': basePath + 'pop.mp3',
            'background': basePath + 'bg-sound.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    // decodeAudioData may require a Promise wrapper in some browsers
                    const audioBuffer = await new Promise((resolve, reject) => {
                        this.audioContext.decodeAudioData(arrayBuffer, resolve, reject);
                    });
                    this.sounds.set(name, audioBuffer);
                } else {
                    console.warn(`⚠️ Não foi possível carregar (status ${response.status}): ${path}`);
                }
            } catch (error) {
                console.warn(`⚠️ Não foi possível carregar: ${path}`, error);
            }
        }
    }

    playSound(name, options = {}) {
        if (!this.isInitialized || !this.sounds.has(name)) return;

        try {
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
                try { source.disconnect(); } catch (e) {}
                try { gainNode.disconnect(); } catch (e) {}
            };
        } catch (error) {
            console.warn('Erro ao tocar som:', error);
        }
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
            try {
                this.backgroundMusic.source.stop();
                this.backgroundMusic = null;
            } catch (error) {
                console.warn('Erro ao pausar música:', error);
            }
        }
    }

    resumeBackgroundMusic() {
        // Recria a música de fundo a partir do buffer
        if (!this.backgroundMusic && this.sounds.has('background')) {
            this.playBackgroundMusic();
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            try {
                this.backgroundMusic.source.stop();
                this.backgroundMusic = null;
            } catch (error) {
                console.warn('Erro ao parar música:', error);
            }
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