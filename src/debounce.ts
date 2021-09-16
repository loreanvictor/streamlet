import { Source, Talkback, Sink } from './types'


class DebounceTalkback<T> implements Talkback {
  constructor(
    private sink: DebouncedSink<T>,
    private talkback: Talkback,
  ) {}

  start() { this.talkback.start() }
  request() { this.talkback.request() }
  end() {
    if (this.sink.timeout) {
      clearTimeout(this.sink.timeout)
      this.sink.timeout = undefined
    }
  }
}


export class DebouncedSink<T> implements Sink<T> {
  timeout: NodeJS.Timeout | undefined;
  shouldTerminate = false;

  constructor(
    private sink: Sink<T>,
    private wait: number,
  ) {}

  greet(talkback: Talkback) {
    this.sink.greet(new DebounceTalkback(this, talkback))
  }

  receive(t: T) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(() => {
      this.sink.receive(t)
      if (this.shouldTerminate) {
        this.sink.end()
      }

      this.timeout = undefined
    }, this.wait)
  }

  end(reason?: unknown) {
    if (reason === undefined && this.timeout !== undefined) {
      this.shouldTerminate = true
    } else {
      this.sink.end(reason)
    }
  }
}


export class DebouncedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private wait: number,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new DebouncedSink(sink, this.wait))
  }
}


export function debounce<T>(wait: number)
  : (source: Source<T>) => Source<T> {
  return (source: Source<T>) => new DebouncedSource(source, wait)
}
