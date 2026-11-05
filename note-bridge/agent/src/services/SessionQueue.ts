/** 同一会话的写操作按提交顺序执行；某次失败不能阻断后续任务。 */
export class SessionQueue {
  private readonly queues = new Map<string, Promise<unknown>>();

  async run<T>(key: string, work: () => Promise<T>): Promise<T> {
    const prior = this.queues.get(key) ?? Promise.resolve();
    const current = prior.catch(() => {}).then(work);
    this.queues.set(key, current);
    try {
      return await current;
    } finally {
      if (this.queues.get(key) === current) {
        this.queues.delete(key);
      }
    }
  }
}
