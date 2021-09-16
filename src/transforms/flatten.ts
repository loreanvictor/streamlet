import { Talkback, Source, Sink } from '../types'


class FlattenedTalkback<T> implements Talkback {
  constructor(
    private sink: FlattenedSink<T>
  ) {}

  start() {}

  request() {
    (this.sink.innerTalkback || this.sink.outerTalkback)?.request()
  }

  end() {
    this.sink.innerTalkback?.end()
    this.sink.outerTalkback?.end()
  }
}


class FlattenedInnerSink<T> implements Sink<T> {
  constructor(
    private sink: FlattenedSink<T>,
  ) {}

  greet(talkback: Talkback) {
    this.sink.innerTalkback = talkback
    talkback.start()
    talkback.request()
  }

  receive(t: T) {
    this.sink.sink.receive(t)
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.sink.outerTalkback?.end()
      this.sink.sink.end(reason)
    } else {
      if (!this.sink.outerTalkback) {
        this.sink.sink.end()
      } else {
        this.sink.innerTalkback = void 0
        this.sink.outerTalkback.request()
      }
    }
  }
}


export class FlattenedSink<T> implements Sink<Source<T>> {
  outerTalkback: Talkback | undefined
  innerTalkback: Talkback | undefined
  talkback: FlattenedTalkback<T>

  constructor(
    readonly sink: Sink<T>,
  ) {
    this.talkback = new FlattenedTalkback(this)
  }

  greet(talkback: Talkback) {
    this.outerTalkback = talkback
    talkback.start()
    this.sink.greet(this.talkback)
  }

  receive(innerSource: Source<T>) {
    this.innerTalkback?.end()
    innerSource.connect(new FlattenedInnerSink(this))
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.innerTalkback?.end()

      this.sink.end(reason)
    } else {
      if (!this.innerTalkback) {
        this.sink.end()
      } else {
        this.outerTalkback = void 0
      }
    }
  }
}


export class FlattenedSource<T> implements Source<T> {
  constructor(
    private source: Source<Source<T>>
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new FlattenedSink(sink))
  }
}


export function flatten<T>(source: Source<Source<T>>): Source<T> {
  return new FlattenedSource(source)
}
