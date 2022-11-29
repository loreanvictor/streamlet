import { from } from '../sources/expr'
import { isSourceable, Mapping, Sink, Source, Sourceable, SourceableMapping, Talkback } from '../types'


export class MappedSink<I, O> implements Sink<I> {
  talkback: Talkback

  constructor(
    private sink: Sink<O>,
    private op: Mapping<I, O>,
  ) { }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(data: I) {
    try {
      this.sink.receive(this.op(data))
    } catch (err) {
      this.sink.end(err)
      this.talkback.stop(err)
    }
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


export function map<I, O>(op: Mapping<I, O>): SourceableMapping<I, O>
export function map<I, O>(source: Sourceable<I>, op: Mapping<I, O>): Source<O>
export function map<I, O>(source: Sourceable<I> | Mapping<I, O>, op?: Mapping<I, O>):
  Source<O> | SourceableMapping<I, O> {
  if (isSourceable(source) && op) {
    return new MappedSource(from(source), op!)
  } else {
    return (src: Sourceable<I>) => map(src, source as Mapping<I, O>)
  }
}
