import { Source, Sink, Talkback } from './types'


export class TakeTalkback<T> implements Talkback {
  constructor(
    private sink: TakeSink<T>,
  ) {}

  start() {
    if (this.sink.taken < this.sink.max) {
      this.sink.sourceTalkback.start()
    }
  }

  request() {
    if (this.sink.taken < this.sink.max) {
      this.sink.sourceTalkback.request()
    }
  }

  end(reason?: unknown) {
    this.sink.disposed = true
    this.sink.sourceTalkback.end(reason)
  }
}


export class TakeSink<T> implements Sink<T> {
  taken = 0;
  disposed = false;
  sourceTalkback: Talkback;
  talkback: TakeTalkback<T>;

  constructor(
    private sink: Sink<T>,
    readonly max: number,
  ) {
    this.talkback = new TakeTalkback(this)
  }

  greet(talkback: Talkback) {
    this.sourceTalkback = talkback
    this.sink.greet(this.talkback)
  }

  receive(t: T) {
    if (this.taken < this.max) {
      this.taken++
      this.sink.receive(t)

      if (this.taken === this.max && !this.disposed) {
        this.disposed = true
        this.sourceTalkback.end()
        this.sink.end()
      }
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class TakeSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private max: number,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new TakeSink(sink, this.max))
  }
}


export function take(max: number)
  : <T>(source: Source<T>) => Source<T> {
  return <T>(source: Source<T>) => new TakeSource(source, max)
}
