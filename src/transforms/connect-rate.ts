import { Source, Sink, USourceFactory } from '../types'
import { wait, stopWaiting, Waiting, WaitNotifier } from '../util'


export class ConnectRateSource<T> implements Source<T> {
  waiting: Waiting | undefined
  initial = true

  constructor(
    private readonly source: Source<T>,
    private readonly rate: WaitNotifier,
  ) { }

  connect(sink: Sink<T>) {
    if (this.initial) {
      this.initial = false
      this.source.connect(sink)
    } else {
      this.reset()
      this.waiting = wait(() => {
        this.reset()
        this.source.connect(sink)
      }, this.rate)
    }
  }

  reset() {
    if (this.waiting) {
      stopWaiting(this.waiting)
      this.waiting = undefined
    }
  }
}


export function connectRate(rate: WaitNotifier): USourceFactory
export function connectRate<T>(source: Source<T>, rate: WaitNotifier): Source<T>
export function connectRate<T>(source: Source<T> | WaitNotifier, rate?: WaitNotifier): Source<T> | USourceFactory {
  if (rate !== undefined) {
    return new ConnectRateSource(source as Source<T>, rate)
  } else {
    return <U>(src: Source<U>) => connectRate(src, source as WaitNotifier)
  }
}
