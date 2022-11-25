import { Sink, Source, Talkback, Handler, Sourceable, SourceableFactory } from '../types'
import { from } from '../sources/expr'


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


export function greet<T>(op: Handler<Talkback>): SourceableFactory<T>
export function greet<T>(source: Sourceable<T>, op: Handler<Talkback>): Source<T>
export function greet<T>(source: Sourceable<T> | Handler<Talkback>, op?: Handler<Talkback>):
  SourceableFactory<T> | Source<T> {
  if (op !== undefined) {
    return new GreetedSource(from(source as Sourceable<T>), op)
  } else {
    return (src: Sourceable<T>) => greet(src, source as Handler<Talkback>)
  }
}
