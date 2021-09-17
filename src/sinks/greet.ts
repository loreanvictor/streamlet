import { Sink, Source, Talkback, SourceFactory, Handler } from '../types'


export class GreetedSink<T> implements Sink<T> {
  constructor(
    private sink: Sink<T>,
    private op: Handler<Talkback>,
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
    private op: Handler<Talkback>,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new GreetedSink(sink, this.op))
  }
}


export function greet<T>(op: Handler<Talkback>): SourceFactory<T>
export function greet<T>(source: Source<T>, op: Handler<Talkback>): Source<T>
export function greet<T>(source: Source<T> | Handler<Talkback>, op?: Handler<Talkback>): SourceFactory<T> | Source<T> {
  if (op !== undefined) {
    return new GreetedSource(source as Source<T>, op)
  } else {
    return (src: Source<T>) => greet(src, source as Handler<Talkback>)
  }
}
