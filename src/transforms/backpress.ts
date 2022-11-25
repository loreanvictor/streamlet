import { Source, Sourceable, Sink, Talkback } from '../types'
import { from } from '../sources/expr'


export class BackPressingSink<T> implements Sink<T>, Talkback {
  talkback: Talkback
  stopped = true
  requested = false
  hasLeakage = false
  leakage: T

  constructor(
    private readonly sink: Sink<T>,
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(this)
  }

  receive(value: T) {
    if (!this.requested) {
      this.stop()
      this.hasLeakage = true
      this.leakage = value
    } else {
      this.requested = false
      this.sink.receive(value)
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }

  start() {
    this.stopped = false
    this.talkback.start()
  }

  request() {
    if (this.hasLeakage) {
      this.hasLeakage = false
      this.sink.receive(this.leakage)
    } else {
      this.requested = true
      if (this.stopped) {
        this.start()
      }

      this.talkback.request()
    }
  }

  stop(reason?: unknown) {
    this.stopped = true
    this.talkback.stop(reason)
  }
}


export class BackPressedSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new BackPressingSink(sink))
  }
}


export function backpress<T>(source: Sourceable<T>) {
  return new BackPressedSource(from(source))
}
