import { from } from '../sources/expr'
import { Talkback, Source, Sourceable, Sink } from '../types'


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
      if (this.sink.ended) {
        this.sink.sink.end()
      } else if (!this.sink.talkback.disposed
          && this.sink.talkback.requested) {
        this.sink.outerTalkback.request()
      }
    }
  }
}


export class FlattenedSink<T> implements Sink<Sourceable<T>> {
  outerTalkback: Talkback
  innerTalkback: Talkback | undefined
  talkback: FlattenedTalkback<T>
  ended = false

  constructor(
    readonly sink: Sink<T>,
  ) {
    this.talkback = new FlattenedTalkback(this)
  }

  greet(talkback: Talkback) {
    this.outerTalkback = talkback
    this.sink.greet(this.talkback)
  }

  receive(innerSource: Sourceable<T>) {
    this.innerTalkback?.stop()
    this.innerTalkback = undefined
    from(innerSource).connect(new FlattenedInnerSink(this))
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.innerTalkback?.stop(reason)
      this.innerTalkback = undefined
      this.sink.end(reason)
    } else {
      this.ended = true
      if (!this.innerTalkback) {
        this.sink.end()
      }
    }
  }
}


export class FlattenedSource<T> implements Source<T> {
  constructor(
    private source: Source<Sourceable<T>>
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new FlattenedSink(sink))
  }
}


export function flatten<T>(source: Sourceable<Sourceable<T>>): Source<T> {
  return new FlattenedSource(from(source))
}
