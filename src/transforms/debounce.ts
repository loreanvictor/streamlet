import { Source, Talkback, Sink, SourceFactory, isSource } from '../types'
import { wait, stopWaiting, WaitNotifier, Waiting, WaitIndicator, resolveWait } from '../util/wait'


export class DebouncedSink<T> implements Sink<T> {
  waiting: Waiting | undefined
  shouldTerminate = false

  constructor(
    private sink: Sink<T>,
    private notif: WaitNotifier | WaitIndicator<T>,
  ) {}

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(t: T) {
    this.reset()
    this.waiting = wait(() => this.bleed(t), resolveWait(this.notif, t))
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


export function debounce<T>(notif: WaitNotifier | WaitIndicator<T>): SourceFactory<T>
export function debounce<T>(source: Source<T>, notif: WaitNotifier | WaitIndicator<T>): Source<T>
export function debounce<T>(
  source: Source<T> | WaitNotifier | WaitIndicator<T>,
  notif?: WaitNotifier | WaitIndicator<T>
): SourceFactory<T> | Source<T> {
  if (isSource(source) && !!notif) {
    return new DebouncedSource(source, notif!)
  } else {
    return (src: Source<T>) => debounce(src, source)
  }
}
