import { from } from '../sources/expr'
import { Source, Sink, Talkback, Sourceable, USourceableFactory, isSourceable } from '../types'


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


export function take(max: number): USourceableFactory
export function take<T>(source: Sourceable<T>, max: number): Source<T>
export function take<T>(source: Sourceable<T> | number, max?: number): USourceableFactory | Source<T> {
  if (isSourceable(source)) {
    return new TakeSource(from(source), max!)
  } else {
    return <U>(src: Sourceable<U>) => take(src, source)
  }
}
