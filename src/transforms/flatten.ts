import { Talkback, Source, Sink } from '../types'


class FlattenedTalkback<T> implements Talkback {
  disposed = false
  requested = false

  constructor(
    private sink: FlattenedSink<T>
  ) {}

  start() {
    this.disposed = false
    this.sink.innerTalkback?.start()
    this.sink.outerTalkback.start()
  }

  request() {
    this.requested = true;
    (this.sink.innerTalkback || this.sink.outerTalkback).request()
  }

  stop() {
    this.disposed = true
    this.sink.innerTalkback?.stop()
    this.sink.outerTalkback.stop()
  }
}


class FlattenedInnerSink<T> implements Sink<T> {
  constructor(
    private sink: FlattenedSink<T>,
  ) {}

  greet(talkback: Talkback) {
    this.sink.innerTalkback = talkback
    talkback.start()
    if (this.sink.talkback.requested) {
      talkback.request()
    }
  }

  receive(t: T) {
    this.sink.talkback.requested = false
    this.sink.sink.receive(t)
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.sink.outerTalkback!.stop()
      this.sink.sink.end(reason)
    } else {
      this.sink.innerTalkback = undefined
      if (!this.sink.talkback.disposed
          && this.sink.talkback.requested) {
        this.sink.outerTalkback.request()
      }
    }
  }
}


export class FlattenedSink<T> implements Sink<Source<T>> {
  outerTalkback: Talkback
  innerTalkback: Talkback | undefined
  talkback: FlattenedTalkback<T>

  constructor(
    readonly sink: Sink<T>,
  ) {
    this.talkback = new FlattenedTalkback(this)
  }

  greet(talkback: Talkback) {
    this.outerTalkback = talkback
    this.sink.greet(this.talkback)
  }

  receive(innerSource: Source<T>) {
    this.innerTalkback?.stop()
    this.innerTalkback = undefined
    innerSource.connect(new FlattenedInnerSink(this))
  }

  end(reason?: unknown) {
    this.innerTalkback?.stop()
    this.innerTalkback = undefined
    this.sink.end(reason)
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
