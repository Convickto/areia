// Monitor de performance para otimização
export class PerformanceMonitor {
    constructor() {
        this.fpsHistory = [];
        this.frameTimes = [];
        this.maxHistorySize = 60;
        this.isMonitoring = false;
        this.memoryUsage = [];
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

        // Monitora uso de memória
        if ('memory' in performance) {
            this.memoryUsage.push(performance.memory.usedJSHeapSize);
            if (this.memoryUsage.length > this.maxHistorySize) {
                this.memoryUsage.shift();
            }
        }

        requestAnimationFrame(() => this.monitorFrame());
    }

    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 0;
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }

    getCurrentFPS() {
        if (this.fpsHistory.length === 0) return 0;
        return this.fpsHistory[this.fpsHistory.length - 1];
    }

    getMemoryUsage() {
        if (this.memoryUsage.length === 0) return 0;
        return this.memoryUsage[this.memoryUsage.length - 1];
    }

    getPerformanceReport() {
        return {
            fps: this.getCurrentFPS(),
            averageFps: this.getAverageFPS(),
            memoryUsage: this.getMemoryUsage(),
            isOptimal: this.getCurrentFPS() >= 55
        };
    }
}
