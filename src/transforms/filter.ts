import { Source, Sink, Talkback, Condition, SourceFactory, TypeCondition, isSource } from '../types'


export class FilteredSink<T> implements Sink<T> {
  talkback: Talkback;

  constructor(
    private sink: Sink<T>,
    private condition: Condition<T>,
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
    private condition: Condition<T>,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new FilteredSink(sink, this.condition))
  }
}


export function filter<T, W extends T>(condition: TypeCondition<T, W>): SourceFactory<T, Source<W>>
export function filter<T, W extends T>(source: Source<T>, condition: TypeCondition<T, W>): Source<W>
export function filter<T>(condition: Condition<T>): SourceFactory<T>
export function filter<T>(source: Source<T>, condition: Condition<T>): Source<T>
export function filter<T>(source: Source<T> | Condition<T>, condition?: Condition<T>): SourceFactory<T> | Source<T> {
  if (isSource(source)) {
    return new FilteredSource(source, condition!)
  } else {
    return (src: Source<T>) => filter(src, source as Condition<T>)
  }
}
