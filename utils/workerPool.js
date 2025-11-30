/**
 * WorkerPool - Manage web workers for heavy computations
 * Offloads expensive tasks to background threads to keep UI responsive
 */
class WorkerPool {
    constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
        this.workerScript = workerScript;
        this.poolSize = poolSize;
        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue = [];
        this.taskId = 0;
        
        this.initialize();
    }
    
    /**
     * Initialize worker pool
     */
    initialize() {
        for (let i = 0; i < this.poolSize; i++) {
            this.createWorker();
        }
    }
    
    /**
     * Create a new worker
     */
    createWorker() {
        const worker = new Worker(this.workerScript);
        const workerWrapper = {
            worker: worker,
            busy: false,
            currentTask: null
        };
        
        worker.onmessage = (e) => {
            this.handleWorkerMessage(workerWrapper, e);
        };
        
        worker.onerror = (error) => {
            this.handleWorkerError(workerWrapper, error);
        };
        
        this.workers.push(workerWrapper);
        this.availableWorkers.push(workerWrapper);
    }
    
    /**
     * Execute task in worker
     * @param {string} action - Action to perform
     * @param {*} data - Data to process
     * @returns {Promise}
     */
    execute(action, data) {
        return new Promise((resolve, reject) => {
            const task = {
                id: this.taskId++,
                action: action,
                data: data,
                resolve: resolve,
                reject: reject,
                timestamp: Date.now()
            };
            
            // Try to execute immediately if worker available
            if (this.availableWorkers.length > 0) {
                this.executeTask(task);
            } else {
                // Queue task if all workers busy
                this.taskQueue.push(task);
            }
        });
    }
    
    /**
     * Execute a task on available worker
     * @param {Object} task - Task to execute
     */
    executeTask(task) {
        const workerWrapper = this.availableWorkers.shift();
        
        if (!workerWrapper) {
            this.taskQueue.push(task);
            return;
        }
        
        workerWrapper.busy = true;
        workerWrapper.currentTask = task;
        
        workerWrapper.worker.postMessage({
            id: task.id,
            action: task.action,
            data: task.data
        });
    }
    
    /**
     * Handle worker message
     * @param {Object} workerWrapper - Worker wrapper
     * @param {MessageEvent} e - Message event
     */
    handleWorkerMessage(workerWrapper, e) {
        const { id, result, error } = e.data;
        const task = workerWrapper.currentTask;
        
        if (!task || task.id !== id) {
            console.error('Task ID mismatch');
            return;
        }
        
        // Release worker
        workerWrapper.busy = false;
        workerWrapper.currentTask = null;
        this.availableWorkers.push(workerWrapper);
        
        // Resolve or reject task
        if (error) {
            task.reject(new Error(error));
        } else {
            task.resolve(result);
        }
        
        // Execute next queued task
        if (this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift();
            this.executeTask(nextTask);
        }
    }
    
    /**
     * Handle worker error
     * @param {Object} workerWrapper - Worker wrapper
     * @param {ErrorEvent} error - Error event
     */
    handleWorkerError(workerWrapper, error) {
        const task = workerWrapper.currentTask;
        
        if (task) {
            task.reject(error);
        }
        
        // Release worker
        workerWrapper.busy = false;
        workerWrapper.currentTask = null;
        this.availableWorkers.push(workerWrapper);
        
        console.error('Worker error:', error);
    }
    
    /**
     * Get pool statistics
     * @returns {Object}
     */
    getStats() {
        return {
            totalWorkers: this.workers.length,
            availableWorkers: this.availableWorkers.length,
            busyWorkers: this.workers.length - this.availableWorkers.length,
            queuedTasks: this.taskQueue.length
        };
    }
    
    /**
     * Terminate all workers
     */
    terminate() {
        this.workers.forEach(workerWrapper => {
            workerWrapper.worker.terminate();
        });
        
        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue = [];
    }
}

/**
 * Performance Worker Manager - Simplifies worker usage for common tasks
 */
class PerformanceWorkerManager {
    constructor() {
        this.workerPools = new Map();
        this.inlineWorkerScripts = new Map();
    }
    
    /**
     * Create inline worker from function
     * @param {Function} workerFunc - Function to run in worker
     * @returns {string} Blob URL for worker script
     */
    createInlineWorker(workerFunc) {
        const workerCode = `
            self.onmessage = function(e) {
                const { id, action, data } = e.data;
                try {
                    const result = (${workerFunc.toString()})(action, data);
                    self.postMessage({ id, result });
                } catch (error) {
                    self.postMessage({ id, error: error.message });
                }
            };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        return URL.createObjectURL(blob);
    }
    
    /**
     * Get or create worker pool
     * @param {string} name - Pool name
     * @param {string|Function} workerScript - Worker script path or function
     * @param {number} poolSize - Pool size
     * @returns {WorkerPool}
     */
    getPool(name, workerScript, poolSize) {
        if (this.workerPools.has(name)) {
            return this.workerPools.get(name);
        }
        
        // Create inline worker if function provided
        let scriptURL = workerScript;
        if (typeof workerScript === 'function') {
            scriptURL = this.createInlineWorker(workerScript);
            this.inlineWorkerScripts.set(name, scriptURL);
        }
        
        const pool = new WorkerPool(scriptURL, poolSize);
        this.workerPools.set(name, pool);
        
        return pool;
    }
    
    /**
     * Execute task in worker pool
     * @param {string} poolName - Pool name
     * @param {string} action - Action to perform
     * @param {*} data - Data to process
     * @returns {Promise}
     */
    async execute(poolName, action, data) {
        const pool = this.workerPools.get(poolName);
        
        if (!pool) {
            throw new Error(`Worker pool "${poolName}" not found`);
        }
        
        return pool.execute(action, data);
    }
    
    /**
     * Terminate worker pool
     * @param {string} name - Pool name
     */
    terminatePool(name) {
        const pool = this.workerPools.get(name);
        
        if (pool) {
            pool.terminate();
            this.workerPools.delete(name);
        }
        
        // Revoke inline worker script if exists
        const scriptURL = this.inlineWorkerScripts.get(name);
        if (scriptURL) {
            URL.revokeObjectURL(scriptURL);
            this.inlineWorkerScripts.delete(name);
        }
    }
    
    /**
     * Terminate all worker pools
     */
    terminateAll() {
        this.workerPools.forEach((pool, name) => {
            pool.terminate();
            
            const scriptURL = this.inlineWorkerScripts.get(name);
            if (scriptURL) {
                URL.revokeObjectURL(scriptURL);
            }
        });
        
        this.workerPools.clear();
        this.inlineWorkerScripts.clear();
    }
    
    /**
     * Get stats for all pools
     * @returns {Object}
     */
    getAllStats() {
        const stats = {};
        
        this.workerPools.forEach((pool, name) => {
            stats[name] = pool.getStats();
        });
        
        return stats;
    }
}

// Create global instance
window.performanceWorkerManager = window.performanceWorkerManager || new PerformanceWorkerManager();

// Example worker function for validation/parsing
const validationWorkerFunc = (action, data) => {
    switch (action) {
        case 'validate':
            // Perform validation logic
            return { valid: true, errors: [] };
            
        case 'parse':
            // Perform parsing logic
            return { parsed: data };
            
        case 'analyze':
            // Perform analysis logic
            return { patterns: [], complexity: 0 };
            
        default:
            throw new Error(`Unknown action: ${action}`);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkerPool, PerformanceWorkerManager };
}
