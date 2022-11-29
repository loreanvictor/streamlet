import { from } from '../sources/expr'
import { Source, Talkback, Sink, SourceableFactory, Sourceable, isSourceable } from '../types'
import { wait, stopWaiting, resolveWait, Waiting, WaitNotifier, WaitIndicator } from '../util/wait'


export class ThrottledSink<T> implements Sink<T> {
  waiting: Waiting | undefined
  talkback: Talkback
  disposed = false

  constructor(
    private sink: Sink<T>,
    private notif: WaitNotifier | WaitIndicator<T>,
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(t: T) {
    if (!this.disposed && !this.waiting) {
      this.sink.receive(t)
      try {
        this.waiting = wait(() => this.reset(), resolveWait(this.notif, t))
      } catch (err) {
        this.disposed = true
        this.sink.end(err)
        this.talkback.stop(err)
      }
    }
  }

  end(reason?: unknown) {
    this.reset()
    this.disposed = true
    this.sink.end(reason)
  }

  reset() {
    if (this.waiting) {
      stopWaiting(this.waiting)
      this.waiting = undefined
    }
  }
}


export class ThrottledSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private notif: WaitNotifier | WaitIndicator<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new ThrottledSink(sink, this.notif))
  }
}


export function throttle<T>(notif: WaitNotifier | WaitIndicator<T>): SourceableFactory<T>
export function throttle<T>(source: Sourceable<T>, notif: WaitNotifier | WaitIndicator<T>): Source<T>
export function throttle<T>(
  source: Sourceable<T> | WaitNotifier | WaitIndicator<T>,
  notif?: WaitNotifier | WaitIndicator<T>
): SourceableFactory<T> | Source<T> {
  if (isSourceable(source) && !!notif) {
    return new ThrottledSource(from(source), notif)
  } else {
    return (src: Sourceable<T>) => throttle(src, source as WaitNotifier | WaitIndicator<T>)
  }
}
