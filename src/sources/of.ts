import { Source, Dispose, Sink } from '../types'


class OfTalkback<T> extends Dispose {
  values: T[]
  disposed = false

  constructor(
    private sink: Sink<T>,
    values: T[],
  ) {
    super()
    this.values = values.slice()
  }

  start() {
    this.disposed = false
    while (this.values.length !== 0 && !this.disposed) {
      this.sink.receive(this.values.shift()!)
    }

    if (!this.disposed && this.values.length === 0) {
      this.sink.end()
    }
  }

  stop() {
    this.disposed = true
  }
}


export class Of<T> implements Source<T> {
  constructor(
    private values: T[]
  ) { }

  connect(sink: Sink<T>) {
    sink.greet(new OfTalkback(sink, this.values))
  }
}

export function of<T>(...values: T[]): Source<T> {
  return new Of(values)
}
