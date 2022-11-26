import { from } from '../sources/expr'
import { Source, Sink, USourceableFactory, Sourceable } from '../types'
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


export function connectRate(rate: WaitNotifier): USourceableFactory
export function connectRate<T>(source: Sourceable<T>, rate: WaitNotifier): Source<T>
export function connectRate<T>(source: Sourceable<T> | WaitNotifier, rate?: WaitNotifier): Source<T> | USourceableFactory {
  if (rate !== undefined) {
    return new ConnectRateSource(from(source as Sourceable<T>), rate)
  } else {
    return <U>(src: Sourceable<U>) => connectRate(src, source as WaitNotifier)
  }
}
