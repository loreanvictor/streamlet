import { Source, Sink, Talkback, USourceFactory, isSource } from '../types'


export class TakeSink<T> implements Sink<T>, Talkback {
  taken = 0
  talkback: Talkback

  constructor(
    private sink: Sink<T>,
    readonly max: number,
  ) { }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(this)
  }

  receive(t: T) {
    this.taken++
    this.sink.receive(t)

    if (this.taken >= this.max) {
      this.talkback.stop()
      this.sink.end()
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }

  start() {
    if (this.taken < this.max) {
      this.talkback.start()
    }
  }

  request() {
    if (this.taken < this.max) {
      this.talkback.request()
    }
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
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


export function take(max: number): USourceFactory
export function take<T>(source: Source<T>, max: number): Source<T>
export function take<T>(source: Source<T> | number, max?: number): USourceFactory | Source<T> {
  if (isSource(source)) {
    return new TakeSource(source, max!)
  } else {
    return <U>(src: Source<U>) => take(src, source)
  }
}
