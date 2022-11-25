import { Handler, Sink, Source, Sourceable, SourceableFactory, USourceableFactory, Talkback } from '../types'
import { from } from '../sources/expr'


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


export function tap<T>(op: Handler<T>): SourceableFactory<T>
export function tap(op: Handler<any>): USourceableFactory
export function tap<T>(source: Sourceable<T>, op: Handler<T>): Source<T>
export function tap<T>(source: Sourceable<T> | Handler<T>, op?: Handler<T>): SourceableFactory<T> | Source<T> {
  if (op !== undefined) {
    return new TappedSource(from(source as Sourceable<T>), op)
  } else {
    return (src: Sourceable<T>) => tap(src, source as Handler<T>)
  }
}
