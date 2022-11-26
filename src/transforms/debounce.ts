import { Source, Talkback, Sink, SourceFactory, isSourceable, Sourceable, SourceableFactory } from '../types'
import { wait, stopWaiting, WaitNotifier, Waiting, WaitIndicator, resolveWait } from '../util/wait'
import { from } from '../sources/expr'


export class DebouncedSink<T> implements Sink<T> {
  waiting: Waiting | undefined
  shouldTerminate = false
  talkback: Talkback

  constructor(
    private sink: Sink<T>,
    private notif: WaitNotifier | WaitIndicator<T>,
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(t: T) {
    this.reset()
    try {
      this.waiting = wait(() => this.bleed(t), resolveWait(this.notif, t))
    } catch (err) {
      this.sink.end(err)
      this.talkback.stop(err)
    }
  }

  bleed(t: T) {
    this.sink.receive(t)
    if (this.shouldTerminate) {
      this.sink.end()
    }

    this.reset()
  }

  end(reason?: unknown) {
    if (reason === undefined && this.waiting) {
      this.shouldTerminate = true
    } else {
      this.reset()
      this.sink.end(reason)
    }
  }

  reset() {
    if (this.waiting) {
      stopWaiting(this.waiting)
      this.waiting = undefined
    }
  }
}


export class DebouncedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private notif: WaitNotifier | WaitIndicator<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new DebouncedSink(sink, this.notif))
  }
}


export function debounce<T>(notif: WaitNotifier | WaitIndicator<T>): SourceableFactory<T>
export function debounce<T>(source: Sourceable<T>, notif: WaitNotifier | WaitIndicator<T>): Source<T>
export function debounce<T>(
  source: Sourceable<T> | WaitNotifier | WaitIndicator<T>,
  notif?: WaitNotifier | WaitIndicator<T>
): SourceFactory<T> | Source<T> {
  if (isSourceable(source) && !!notif) {
    return new DebouncedSource(from(source), notif)
  } else {
    return (src: Sourceable<T>) => debounce(src, source as WaitNotifier | WaitIndicator<T>)
  }
}
