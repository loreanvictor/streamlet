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
      this.disposed = false

      this._promise.then(
        value => {
          if (!this.disposed) {
            this.finished = true
            this.sink.receive(value)
            this.sink.end()
          }
        },
        error => {
          if (!this.disposed) {
            this.finished = true
            this.sink.end(error)
          }
        }
      )
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
