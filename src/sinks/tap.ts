import { Handler, Sink, Source, SourceFactory, USourceFactory, Talkback } from '../types'


export class TappedSink<T> implements Sink<T> {
  constructor(
    private sink: Sink<T>,
    private op: Handler<T>,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(data: T) {
    this.op(data)
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class TappedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private op: Handler<T>,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new TappedSink(sink, this.op))
  }
}


export function tap<T>(op: Handler<T>): SourceFactory<T>
export function tap(op: Handler<any>): USourceFactory
export function tap<T>(source: Source<T>, op: Handler<T>): Source<T>
export function tap<T>(source: Source<T> | Handler<T>, op?: Handler<T>): SourceFactory<T> | Source<T> {
  if (op !== undefined) {
    return new TappedSource(source as Source<T>, op)
  } else {
    return (src: Source<T>) => tap(src, source as Handler<T>)
  }
}
