import { Sink, Source, Talkback } from '../types'


export class MappedSink<I, O> implements Sink<I> {
  constructor(
    private sink: Sink<O>,
    private op: (i: I) => O,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(data: I) {
    this.sink.receive(this.op(data))
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class MappedSource<I, O> implements Source<O> {
  constructor(
    private source: Source<I>,
    private op: (i: I) => O,
  ) { }

  connect(sink: Sink<O>) {
    this.source.connect(new MappedSink(sink, this.op))
  }
}


export function map<I, O>(op: (i: I) => O): (source: Source<I>) => Source<O> {
  return (source: Source<I>) => new MappedSource(source, op)
}
