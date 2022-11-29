import { from } from '../sources/expr'
import { Sink, Source, Sourceable, Talkback, USourceableFactory } from '../types'
import { stopWaiting, wait, Waiting, WaitNotifier } from '../util/wait'


class PullRateTalkback implements Talkback {
  waiting: Waiting | undefined

  constructor(
    private readonly talkback: Talkback,
    private readonly sink: PullRateSink<unknown>,
  ) { }

  start() { this.talkback.start() }
  request() {
    this.reset()
    this.waiting = wait(() => {
      if (!this.sink.disposed) {
        this.reset()
        this.talkback.request()
      }
    }, this.sink.rate)
  }

  reset() {
    if (this.waiting) {
      stopWaiting(this.waiting)
      this.waiting = undefined
    }
  }

  stop(reason?: unknown) {
    this.reset()
    this.talkback.stop(reason)
  }
}


export class PullRateSink<T> implements Sink<T> {
  disposed = false

  constructor(
    private readonly sink: Sink<T>,
    readonly rate: WaitNotifier,
  ) { }

  greet(talkback: Talkback) { this.sink.greet(new PullRateTalkback(talkback, this)) }
  receive(t: T) { this.sink.receive(t) }
  end(reason?: unknown) {
    this.disposed = true
    this.sink.end(reason)
  }
}


export class PullRateSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
    private readonly rate: WaitNotifier,
  ) { }

  connect(sink: Sink<T>) { this.source.connect(new PullRateSink(sink, this.rate)) }
}


export function pullrate(rate: WaitNotifier): USourceableFactory
export function pullrate<T>(source: Sourceable<T>, rate: WaitNotifier): Source<T>
export function pullrate<T>(source: Sourceable<T> | WaitNotifier, rate?: WaitNotifier): Source<T> | USourceableFactory {
  if (rate !== undefined) {
    return new PullRateSource(from(source as Sourceable<T>), rate)
  } else {
    return <U>(src: Sourceable<U>) => pullrate(src, source as WaitNotifier)
  }
}
