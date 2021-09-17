import { Source, Sink, Talkback, isSource } from '../types'


class ProxyTalkback<T> implements Talkback {
  constructor(private readonly sink: RetryingSink<T>) { }

  start() { this.sink.talkback?.start() }
  request() { this.sink.talkback?.request() }
  stop(reason?: unknown) { this.sink.talkback?.stop(reason) }
}


export class RetryingSink<T> implements Sink<T> {
  talkback: Talkback | undefined
  proxy: ProxyTalkback<T> | undefined
  retries = 0

  constructor(
    private readonly source: Source<T>,
    private readonly sink: Sink<T>,
    max = -1,
  ) { this.retries = max }

  greet(talkback: Talkback) {
    this.talkback = talkback

    if (!this.proxy) {
      this.proxy = new ProxyTalkback(this)
      this.sink.greet(this.proxy)
    }
  }

  receive(data: T) { this.sink.receive(data) }

  end(reason?: unknown) {
    if (reason !== undefined && this.retries-- !== 0) {
      this.source.connect(this)
    } else {
      this.sink.end(reason)
    }
  }
}


export class RetryingSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
    private readonly max = -1
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new RetryingSink(this, sink, this.max))
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
