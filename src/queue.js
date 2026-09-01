class AsyncQueue {
  constructor({ concurrency = 1 } = {}) {
    this.concurrency = Math.max(1, concurrency);
    this.pending = 0;
    this.size = 0;
    this.queue = [];
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.size = this.queue.length;
      this.#runNext();
    });
  }

  #runNext() {
    while (this.pending < this.concurrency && this.queue.length > 0) {
      const entry = this.queue.shift();
      this.size = this.queue.length;
      this.pending += 1;

      Promise.resolve()
        .then(() => entry.task())
        .then(entry.resolve)
        .catch(entry.reject)
        .finally(() => {
          this.pending -= 1;
          this.#runNext();
        });
    }
  }
}

module.exports = { AsyncQueue };
