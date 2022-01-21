
/**
 *
 * 批量 Promise 归并帮助类
 * @class PromiseHelper
 * @template T
 */
class BatchPromiseHelper<T> {

  private tasks: Promise<T>[] = []

  public static new<T>(...tasks: Promise<T>[]): BatchPromiseHelper<T> {
    return new BatchPromiseHelper<T>().join(...tasks)
  }

  public join(...tasks: Promise<T>[]): BatchPromiseHelper<T> {
    for(let task of tasks) {
      this.tasks.push(task)
    }
    return this
  }

  public async all(): Promise<T[]> {
    return Promise.all(this.tasks)
  }
}

export default BatchPromiseHelper