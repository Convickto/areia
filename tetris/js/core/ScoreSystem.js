// Sistema de pontuação avançado
export class ScoreSystem {
    constructor() {
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastClearTime = 0;
        this.comboTimeout = null;
    }

    addLinesCleared(count, combo = 0) {
        const now = performance.now();
        
        // Sistema de combo
        if (now - this.lastClearTime < 2000) { // 2 segundos para manter combo
            this.combo++;
        } else {
            this.combo = 1;
        }
        
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.lastClearTime = now;

        // Calcula pontuação base
        let baseScore = 0;
        switch (count) {
            case 1: baseScore = 100; break;
            case 2: baseScore = 300; break;
            case 3: baseScore = 500; break;
            case 4: baseScore = 800; break;
            default: baseScore = count * 100;
        }

        // Multiplicadores
        const levelMultiplier = this.level;
        const comboMultiplier = 1 + (this.combo - 1) * 0.5;
        
        const finalScore = Math.floor(baseScore * levelMultiplier * comboMultiplier);
        
        this.score += finalScore;
        this.linesCleared += count;

        // Verifica level up
        const newLevel = Math.floor(this.linesCleared / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
        }

        // Reseta combo após delay
        clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.combo = 0;
        }, 2000);

        return finalScore;
    }

    getScore() {
        return this.score;
    }

    getLevel() {
        return this.level;
    }

    getCombo() {
        return this.combo;
    }

    getMaxCombo() {
        return this.maxCombo;
    }

    getLinesCleared() {
        return this.linesCleared;
    }

    reset() {
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastClearTime = 0;
        clearTimeout(this.comboTimeout);
    }

    getScoreData() {
        return {
            score: this.score,
            level: this.level,
            linesCleared: this.linesCleared,
            combo: this.combo,
            maxCombo: this.maxCombo
        };
    }
}
