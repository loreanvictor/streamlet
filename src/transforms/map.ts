import { isSource, Mapping, Sink, Source, SourceMapping, Talkback } from '../types'


export class MappedSink<I, O> implements Sink<I> {
  constructor(
    private sink: Sink<O>,
    private op: Mapping<I, O>,
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
    private op: Mapping<I, O>,
  ) { }

  connect(sink: Sink<O>) {
    this.source.connect(new MappedSink(sink, this.op))
  }
}


export function map<I, O>(op: Mapping<I, O>): SourceMapping<I, O>
export function map<I, O>(source: Source<I>, op: Mapping<I, O>): Source<O>
export function map<I, O>(source: Source<I> | Mapping<I, O>, op?: Mapping<I, O>): Source<O> | SourceMapping<I, O> {
  if (isSource(source)) {
    return new MappedSource(source, op!)
  } else {
    return (src: Source<I>) => map(src, source)
  }
}
