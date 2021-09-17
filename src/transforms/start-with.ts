import { Source, Sink, Talkback } from '../types'


class StartingWithSink<T, A> implements Sink<T | A> {
  constructor(
    private readonly talkback: StartingWithTalkback<T, A>,
  ) { }

  greet(talkback: Talkback) {
    this.talkback.talkback = talkback
    talkback.start()
    for (let i = 0; i < this.talkback.requests; i++) {
      talkback.request()
    }
  }

  receive(data: T | A) {
    this.talkback.sink.receive(data)
  }

  end(reason?: unknown) {
    this.talkback.sink.end(reason)
  }
}


class StartingWithTalkback<T, A> implements Talkback {
  talkback: Talkback | undefined
  disposed = false
  requests = 0

  constructor(
    readonly source: StartingWithSource<T, A>,
    readonly sink: Sink<T | A>,
  ) { }

  start() {
    for (let i = 0; i < this.source.values.length; i++) {
      if (this.disposed) {
        return
      }

      this.sink.receive(this.source.values[i])
    }

    if (!this.disposed) {
      this.source.source.connect(new StartingWithSink(this))
    }
  }

  request() {
    if (this.talkback) {
      this.talkback.request()
    } else {
      this.requests++
    }
  }

  stop(reason?: unknown) {
    this.disposed = true
    this.talkback?.stop(reason)
  }
}


export class StartingWithSource<T, A> implements Source<T | A> {
  constructor(
    readonly source: Source<T>,
    readonly values: A[],
  ) { }

  connect(sink: Sink<T | A>) {
    sink.greet(new StartingWithTalkback(this, sink))
  }
}


export function startWith<A>(values: A | A[]): <U>(source: Source<U>) => Source<U | A>
export function startWith<T, A>(source: Source<T>, values: A | A[]): Source<T | A>
export function startWith<T, A>(source: Source<T> | A | A[], values?: A | A[])
  : Source<T | A> | (<U>(src: Source<U>) => Source<U | A>) {
  if (values) {
    return new StartingWithSource(source as Source<T>, Array.isArray(values) ? values : [values])
  } else {
    return <U>(src: Source<U>) => startWith(src, source as (A | A[]))
  }
}
