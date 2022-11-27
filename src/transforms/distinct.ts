import { Source, Talkback, Sink, Equals, Sourceable, SourceableFactory } from '../types'
import { from } from '../sources/expr'


function _shallowEq<T>(a: T, b: T): boolean {
  return a === b
}

export class DistinctSink<T> implements Sink<T> {
  initial = true
  last: T

  constructor(
    readonly sink: Sink<T>,
    readonly equals: Equals<T>,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(value: T) {
    if (this.initial || !this.equals(value, this.last)) {
      this.last = value
      this.initial = false
      this.sink.receive(value)
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class DistinctSource<T> implements Source<T> {
  constructor(
    readonly source: Source<T>,
    readonly equals: Equals<T> = _shallowEq,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new DistinctSink(sink, this.equals))
  }
}


export function distinct<T>(source: Sourceable<T>) : Source<T> {
  return new DistinctSource(from(source))
}


export function distinctBy<T>(equals: Equals<T>): SourceableFactory<T>
export function distinctBy<T>(source: Sourceable<T>, equals: Equals<T>): Source<T>
export function distinctBy<T>(source: Sourceable<T> | Equals<T>, equals?: Equals<T>): Source<T> | SourceableFactory<T> {
  if (equals) {
    return new DistinctSource(from(source as Sourceable<T>), equals)
  } else {
    return (src: Sourceable<T>) => new DistinctSource(from(src), source as Equals<T>)
  }
}
