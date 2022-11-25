import { Sink, Source, Talkback, Sourceable, SourceableFactory, Handler } from '../types'
import { from } from '../sources/expr'


export class FinalizedSink<T> implements Sink<T> {
  constructor(
    private sink: Sink<T>,
    private op: Handler<unknown>,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(data: T) {
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    this.op(reason)
    this.sink.end(reason)
  }
}


export class FinalizedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private op: Handler<unknown>,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new FinalizedSink(sink, this.op))
  }
}


export function finalize<T>(op: Handler<unknown>): SourceableFactory<T>
export function finalize<T>(source: Sourceable<T>, op: Handler<unknown>): Source<T>
export function finalize<T>(source: Sourceable<T> | Handler<unknown>, op?: Handler<unknown>):
  SourceableFactory<T> | Source<T> {
  if (op !== undefined) {
    return new FinalizedSource(from(source as Sourceable<T>), op)
  } else {
    return (src: Sourceable<T>) => finalize(src, source as Handler<unknown>)
  }
}
