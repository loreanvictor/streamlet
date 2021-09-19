import { Source, Sink, Talkback } from '../types'


class PromiseTalkback<T> implements Talkback {
  disposed = false
  finished = false

  constructor(
    private readonly sink: Sink<T>,
    private readonly _promise: PromiseLike<T>,
  ) { }

  start() {
    if (this.finished) {
      this.sink.end()
    } else {
      const initial = !this.disposed
      this.disposed = false

      if (initial) {
        this._promise.then(
          value => {
            this.finished = true
            if (!this.disposed) {
              this.sink.receive(value)
              this.sink.end()
            }
          },
          error => {
            this.finished = true
            if (!this.disposed) {
              this.sink.end(error)
            }
          }
        )
      }
    }
  }

  request() {}
  stop() {
    this.disposed = true
  }
}


export class PromiseSource<T> implements Source<T> {
  constructor(
    private readonly _promise: PromiseLike<T>,
  ) { }

  connect(sink: Sink<T>) {
    sink.greet(new PromiseTalkback(sink, this._promise))
  }
}


export function promise<T>(_promise: PromiseLike<T>): Source<T> {
  return new PromiseSource(_promise)
}
