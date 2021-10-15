import { Source, Sink, Talkback, SourceFactory } from '../types'


export class ConcatenatedSink<T> implements Sink<T>, Talkback {
  talkback: Talkback
  initial = true
  requested = false

  constructor(
    private readonly sink: Sink<T>,
    private readonly next: Source<T>[]
  ) { }

  greet(talkback: Talkback) {
    this.talkback = talkback
    if (this.initial) {
      this.initial = false
      this.sink.greet(this)
    } else {
      this.talkback.start()
      if (this.requested) {
        this.talkback.request()
      }
    }
  }

  receive(t: T) {
    this.requested = false
    this.sink.receive(t)
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.sink.end(reason)
    } else {
      if (this.next.length > 0) {
        this.next.shift()!.connect(this)
      } else {
        this.sink.end()
      }
    }
  }

  start() {
    this.talkback.start()
  }

  request() {
    this.requested = true
    this.talkback.request()
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


export class PrependedSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
    private readonly prepended: Source<T>[],
  ) { }

  connect(sink: Sink<T>) {
    const next = this.prepended.slice(1)
    next.push(this.source)

    this.prepended[0].connect(new ConcatenatedSink(sink, next))
  }
}


export class AppendedSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
    private readonly appended: Source<T>[],
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new ConcatenatedSink(sink, this.appended))
  }
}


export function prepend<T>(prepended: Source<T>): SourceFactory<T>
export function prepend<T>(prepended: Source<T>[]): SourceFactory<T>
export function prepend<T>(source: Source<T>, prepended: Source<T>): Source<T>
export function prepend<T>(source: Source<T>, prepended: Source<T>[]): Source<T>
export function prepend<T>(source: Source<T> | Source<T>[], prepended?: Source<T> | Source<T>[])
: Source<T> | SourceFactory<T> {
  if (Array.isArray(source)) {
    return (src: Source<T>) => prepend(src, source)
  } else if (!prepended) {
    return (src: Source<T>) => prepend(src, [source])
  } else if (!Array.isArray(prepended)) {
    return new PrependedSource(source, [prepended])
  } else {
    return new PrependedSource(source, prepended!)
  }
}

export function append<T>(appended: Source<T>): SourceFactory<T>
export function append<T>(appended: Source<T>[]): SourceFactory<T>
export function append<T>(source: Source<T>, appended: Source<T>): Source<T>
export function append<T>(source: Source<T>, appended: Source<T>[]): Source<T>
export function append<T>(source: Source<T> | Source<T>[], appended?: Source<T> | Source<T>[])
: Source<T> | SourceFactory<T> {
  if (Array.isArray(source)) {
    return (src: Source<T>) => append(src, source)
  } else if (!appended) {
    return (src: Source<T>) => append(src, [source])
  } else if (!Array.isArray(appended)) {
    return new AppendedSource(source, [appended])
  } else {
    return new AppendedSource(source, appended!)
  }
}


export function concat<T>(...sources: Source<T>[]) {
  return append(sources[0], sources.slice(1))
}
