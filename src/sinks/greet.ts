import { Sink, Source, Talkback, SourceFactory } from '../types'


type Handler = (talkback: Talkback) => void


export class GreetedSink<T> implements Sink<T> {
  constructor(
    private sink: Sink<T>,
    private op: Handler,
  ) { }

  greet(talkback: Talkback) {
    this.op(talkback)
    this.sink.greet(talkback)
  }

  receive(data: T) {
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class GreetedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private op: Handler,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new GreetedSink(sink, this.op))
  }
}


export function greet<T>(op: Handler): SourceFactory<T>
export function greet<T>(source: Source<T>, op: Handler): Source<T>
export function greet<T>(source: Source<T> | Handler, op?: Handler): SourceFactory<T> | Source<T> {
  if (op !== undefined) {
    return new GreetedSource(source as Source<T>, op)
  } else {
    return (src: Source<T>) => greet(src, source as Handler)
  }
}
