import { from } from '../sources/expr'
import { Sink, Source, Sourceable, Talkback } from '../types'


export class StreamedSink<T> implements Sink<T>, Talkback{
  talkback: Talkback
  disposed = false

  constructor(
    private sink: Sink<T>
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(this)
  }

  receive(value: T) {
    this.sink.receive(value)
    if (!this.disposed) {
      this.talkback.request()
    }
  }

  end(reason?: unknown) {
    this.disposed = true
    this.sink.end(reason)
  }

  start() {
    this.talkback.start()
    if (!this.disposed) {
      this.talkback.request()
    }
  }

  request() {
    if (!this.disposed) {
      this.talkback.request()
    }
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


export class StreamedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new StreamedSink(sink))
  }
}


export function stream<T>(source: Sourceable<T>): Source<T> {
  return new StreamedSource(from(source))
}

