import { Source, Talkback, Sink, Accumulator, SourceMapping, isSource, SourceFactory } from '../types'


export class ScannedSink<I, O> implements Sink<I> {
  total: O | undefined
  talkback: Talkback

  constructor(
    private sink: Sink<O>,
    private accumulator: Accumulator<I, O>,
    private initial?: O,
  ) {
    this.total = this.initial
  }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(i: I) {
    try {
      if (this.total) {
        this.total = this.accumulator(this.total, i)
      } else {
        this.total = i as any as O
      }

      this.sink.receive(this.total)
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


export function scan<T>(accumulator: Accumulator<T>): SourceFactory<T>
export function scan<T>(source: Source<T>, accumulator: Accumulator<T>): Source<T>
export function scan<I, O>(accumulator: Accumulator<I, O>, initial: O): SourceMapping<I, O>
export function scan<I, O>(source: Source<I>, accumulator: Accumulator<I, O>, initial: O): Source<O>
export function scan<I, O>(source: Source<I> | Accumulator<I, O>, accumulator?: Accumulator<I, O> | O, initial?: O)
  : SourceMapping<I, O> | Source<O> {
  if (isSource(source)) {
    return new ScannedSource(source, accumulator! as Accumulator<I, O>, initial)
  } else {
    return (src: Source<I>) => scan(src, source, accumulator as O)
  }
}
