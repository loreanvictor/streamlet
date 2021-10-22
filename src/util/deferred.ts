export class Deferred<T> {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
  promise = new Promise<T>((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })
}
