import { from } from '../sources/expr'
import { Source, Talkback, Sink, Accumulator, SourceableFactory,
  Sourceable, SourceableMapping, isSourceable } from '../types'


const _UNSET = {}

export class ScannedSink<I, O> implements Sink<I> {
  total: O | typeof _UNSET
  talkback: Talkback

  constructor(
    private sink: Sink<O>,
    private accumulator: Accumulator<I, O>,
    private initial: O | typeof _UNSET = _UNSET,
  ) {
    this.total = this.initial
  }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(i: I) {
    try {
      if (this.total !== _UNSET) {
        this.total = this.accumulator(this.total as O, i)
      } else {
        this.total = i as any as O
      }

      this.sink.receive(this.total as O)
    } catch (err) {
      this.sink.end(err)
      this.talkback.stop(err)
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class ScannedSource<I, O> implements Source<O> {
  constructor(
    private source: Source<I>,
    private accumulator: Accumulator<I, O>,
    private initial?: O,
  ) { }

  connect(sink: Sink<O>) {
    this.source.connect(new ScannedSink(sink, this.accumulator, this.initial))
  }
}


export function scan<T>(accumulator: Accumulator<T>): SourceableFactory<T>
export function scan<T>(source: Sourceable<T>, accumulator: Accumulator<T>): Source<T>
export function scan<I, O>(accumulator: Accumulator<I, O>, initial: O): SourceableMapping<I, O>
export function scan<I, O>(source: Sourceable<I>, accumulator: Accumulator<I, O>, initial: O): Source<O>
export function scan<I, O>(source: Sourceable<I> | Accumulator<I, O>, accumulator?: Accumulator<I, O> | O, initial?: O)
  : SourceableMapping<I, O> | Source<O> {
  if (isSourceable(source) && accumulator !== undefined) {
    return new ScannedSource(from(source), accumulator! as Accumulator<I, O>, initial)
  } else {
    return (src: Sourceable<I>) => scan(src, source as Accumulator<I, O>, accumulator as O)
  }
}
