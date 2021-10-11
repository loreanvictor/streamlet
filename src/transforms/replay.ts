import { Sink, Source, Talkback } from '../types'
import { Subject } from '../sources'


class ReplayTalkback<T> implements Talkback {
  constructor(
    private source: ReplayedSource<T>,
    private sink: ReplaySink<T>,
    private talkback: Talkback,
  ) { }

  start() {
    this.talkback.start()
    if (this.source.emitted) {
      this.sink.receive(this.source.last)
    }
  }

  request() { this.talkback.request() }
  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


class ReplaySink<T> implements Sink<T> {
  constructor(
    private source: ReplayedSource<T>,
    private sink: Sink<T>,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(new ReplayTalkback(this.source, this, talkback))
  }

  receive(data: T) {
    this.source.emitted = true
    this.source.last = data
    this.sink.receive(data)
  }

  end(reason?: unknown) { this.sink.end(reason) }
}


export class ReplayedSource<T> implements Source<T> {
  last: T
  emitted = false

  constructor(
    private source: Source<T>,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new ReplaySink(this, sink))
  }
}


export class ReplayedSubject<T> extends ReplayedSource<T> implements Sink<T>, Talkback {
  constructor(
    private subject: Subject<T>,
  ) {
    super(subject)
  }

  greet(talkback: Talkback) {
    this.subject.greet(talkback)
  }

  receive(data: T) {
    this.subject.receive(data)
  }

  end(reason?: unknown) {
    this.subject.end(reason)
  }

  start() {
    this.subject.start()
  }

  request() {
    this.subject.request()
  }

  stop(reason?: unknown) {
    this.subject.stop(reason)
  }
}


export function replay<T>(subject: Subject<T>): ReplayedSubject<T>
export function replay<T>(source: Source<T>): ReplayedSource<T>
export function replay<T>(source: Subject<T> | Source<T>) {
  if (source instanceof Subject) {
    return new ReplayedSubject(source)
  } else {
    return new ReplayedSource(source)
  }
}
