import { from } from '../sources'
import { Source, Sink, Talkback, USourceableFactory, Sourceable, isSourceable } from '../types'


export class RetryingSink<T> implements Sink<T>, Talkback {
  talkback: Talkback
  initial = true
  retries = 0
  requested = false

  constructor(
    private readonly source: Source<T>,
    private readonly sink: Sink<T>,
    max: number,
  ) { this.retries = max }

  greet(talkback: Talkback) {
    this.talkback = talkback

    if (this.initial) {
      this.initial = false
      this.sink.greet(this)
    } else {
      this.talkback.start()
      if (this.requested) {
        this.talkback.request()
      }
    }
  }

  receive(data: T) {
    this.requested = false
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    if (reason !== undefined && this.retries-- !== 0) {
      this.source.connect(this)
    } else {
      this.sink.end(reason)
    }
  }

  start() {
    this.talkback.start()
  }

  request() {
    this.requested = true
    this.talkback.request()
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


export class RetryingSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
    private readonly max = -1
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new RetryingSink(this.source, sink, this.max))
  }
}


export function retry(max?: number): USourceableFactory
export function retry<T>(source: Sourceable<T>, max?: number): Source<T>
export function retry<T>(source?: Sourceable<T> | number, max?: number): Source<T> | USourceableFactory{
  if (isSourceable(source)) {
    return new RetryingSource(from(source), max)
  } else {
    return <U>(src: Sourceable<U>) => retry(src, source as number)
  }
}
