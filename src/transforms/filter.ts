import { Source, Sink, Talkback } from '../types'


export class FilteredSink<T> implements Sink<T> {
  talkback: Talkback;

  constructor(
    private sink: Sink<T>,
    private condition: (t: T) => boolean,
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(t: T) {
    if (this.condition(t)) {
      this.sink.receive(t)
    } else {
      this.talkback.request()
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class FilteredSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private condition: (t: T) => boolean,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new FilteredSink(sink, this.condition))
  }
}


export function filter<T, W extends T>(condition: (t: T) => t is W): (source: Source<T>) => Source<W>
export function filter<T>(condition: (t: T) => boolean): (source: Source<T>) => Source<T>
export function filter<T>(condition: (t: T) => boolean) {
  return (source: Source<T>) => new FilteredSource(source, condition)
}
