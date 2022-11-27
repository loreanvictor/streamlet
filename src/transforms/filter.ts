import { from } from '../sources/expr'
import { Source, Sink, Talkback, Condition, TypeCondition, SourceableFactory, Sourceable, isSourceable } from '../types'


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
    try {
      if (this.condition(t)) {
        this.sink.receive(t)
      } else {
        this.talkback.request()
      }
    } catch (err) {
      this.sink.end(err)
      this.talkback.stop(err)
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


export function filter<T, W extends T>(condition: TypeCondition<T, W>): SourceableFactory<T, Source<W>>
export function filter<T, W extends T>(source: Sourceable<T>, condition: TypeCondition<T, W>): Source<W>
export function filter<T>(condition: Condition<T>): SourceableFactory<T>
export function filter<T>(source: Sourceable<T>, condition: Condition<T>): Source<T>
export function filter<T>(source: Sourceable<T> | Condition<T>, condition?: Condition<T>): SourceableFactory<T> | Source<T> {
  if (isSourceable(source) && condition) {
    return new FilteredSource(from(source), condition!)
  } else {
    return (src: Sourceable<T>) => filter(src, source as Condition<T>)
  }
}
