import { Source, Talkback, Sink, Equals } from '../types'


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
    readonly equals: Equals<T>,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new DistinctSink(sink, this.equals))
  }
}


export function distinct<T>(source: Source<T>, equals: Equals<T> = _shallowEq) {
  return new DistinctSource(source, equals)
}
