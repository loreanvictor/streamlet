import { Sink, Source, Talkback } from '../types'


export class StreamedTalkback<T> implements Talkback {
  private inited = false

  constructor(
    private sink: StreamedSink<T>,
  ) {}

  start() {
    this.sink.talkback?.start()
    if (!this.sink.disposed) {
      this.inited = true
      this.sink.talkback?.request()
    }
  }

  request() {
    if (this.inited) {
      this.sink.talkback?.request()
    }
  }

  stop(reason?: unknown) {
    this.sink.talkback?.stop(reason)
  }
}


export class StreamedSink<T> implements Sink<T> {
  talkback: Talkback
  disposed = false

  constructor(
    private sink: Sink<T>
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(new StreamedTalkback(this))
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
}


export class StreamedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new StreamedSink(sink))
  }
}


export function stream<T>(source: Source<T>): Source<T> {
  return new StreamedSource(source)
}

