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
