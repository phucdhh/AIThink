class QueueService {
  constructor(maxConcurrent = 4) {
    this.maxConcurrent = maxConcurrent;
    this.activeRequests = 0;
    this.queue = [];
    this.requestId = 0;
    this.onStatusChange = null; // Callback to broadcast status
  }

  async addToQueue(task) {
    const id = ++this.requestId;
    
    if (this.activeRequests < this.maxConcurrent) {
      // Increment BEFORE executing to reserve the slot immediately
      this.activeRequests++;
      this.broadcastStatus();
      return this.executeTask(id, task);
    }

    // Add to queue
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        task,
        resolve,
        reject
      });
      // Broadcast status immediately when added to queue
      this.broadcastStatus();
    });
  }

  async executeTask(id, task) {
    // activeRequests already incremented in addToQueue or processQueue
    try {
      const result = await task();
      return result;
    } finally {
      this.activeRequests--;
      this.processQueue();
      this.broadcastStatus();
    }
  }

  processQueue() {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const { id, task, resolve, reject } = this.queue.shift();
      // Increment counter before executing from queue
      this.activeRequests++;
      this.broadcastStatus();
      
      this.executeTask(id, task)
        .then(resolve)
        .catch(reject);
    }
  }

  getStatus() {
    // canAcceptNew = true when queue has space (less than 2 waiting)
    // activeRequests = currently processing (max 2)
    // queuedRequests = waiting in queue
    const canAcceptNew = this.queue.length < 2;
    
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      canAcceptNew
    };
  }

  broadcastStatus() {
    if (this.onStatusChange) {
      this.onStatusChange(this.getStatus());
    }
  }

  setStatusChangeCallback(callback) {
    this.onStatusChange = callback;
  }
}

export default QueueService;
