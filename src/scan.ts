import { Source, Talkback, Sink } from './types'


export class ScannedSink<I, O> implements Sink<I> {
  total: O | undefined

  constructor(
    private sink: Sink<O>,
    private accumulator: (o: O, i: I) => O,
    private initial?: O,
  ) {
    this.total = this.initial
  }

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(i: I) {
    if (this.total) {
      this.total = this.accumulator(this.total, i)
    } else {
      this.total = i as any as O
    }

    this.sink.receive(this.total)
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class ScannedSource<I, O> implements Source<O> {
  constructor(
    private source: Source<I>,
    private accumulator: (o: O, i: I) => O,
    private initial?: O,
  ) { }

  connect(sink: Sink<O>) {
    this.source.connect(new ScannedSink(sink, this.accumulator, this.initial))
  }
}


export function scan<T>(accumulator: (t: T, i: T) => T): (source: Source<T>) => Source<T>;
export function scan<I, O>(accumulator: (total: O, each: I) => O, initial: O): (source: Source<I>) => Source<O>;
export function scan<I, O>(accumulator: (total: O, each: I) => O, initial?: O) {
  return (source: Source<I>) => new ScannedSource(source, accumulator, initial)
}
