import { Source, Sink, Talkback, isSource } from '../types'


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


export function retry(max?: number): <U>(source: Source<U>) => Source<U>
export function retry<T>(source: Source<T>, max?: number): Source<T>
export function retry<T>(source?: Source<T> | number, max?: number): Source<T> | (<U>(src: Source<U>) => Source<U>) {
  if (isSource(source)) {
    return new RetryingSource(source, max)
  } else {
    return <U>(src: Source<U>) => retry(src, source as number)
  }
}
