import { Sink, Source, Talkback } from '../types'


class ReplayTalkback<T> implements Talkback {
  constructor(
    private source: ReplayedSource<T>,
    private sink: ReplaySink<T>,
    private talkback: Talkback,
  ) { }

  start() {
    this.talkback.start()
    if (this.source.emitted) {
      this.sink.receive(this.source.last as T)
    }
  }

  request() { this.talkback.request() }
  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


class ReplaySink<T> implements Sink<T> {
  constructor(
    private source: ReplayedSource<T>,
    private sink: Sink<T>,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(new ReplayTalkback(this.source, this, talkback))
  }

  receive(data: T) {
    this.source.emitted = true
    this.source.last = data
    this.sink.receive(data)
  }

  end(reason?: unknown) { this.sink.end(reason) }
}


export class ReplayedSource<T> implements Source<T> {
  last: T
  emitted = false

  constructor(
    private source: Source<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new ReplaySink(this, sink))
  }
}


export function replay<T>(source: Source<T>) {
  return new ReplayedSource(source)
}
