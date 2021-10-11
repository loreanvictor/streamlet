import { Source, Sink, Talkback } from '../types'



function isIterable<T>(t: Iterable<T> | Iterator<T>): t is Iterable<T> {
  return t !== undefined && typeof Symbol !== 'undefined' && (t as any)[Symbol.iterator] !== undefined
}


class IterableTalkback<T> implements Talkback {
  iterator: Iterator<T>
  inloop = false
  disposed = false
  got = false
  last: IteratorResult<T>

  constructor(
    private sink: Sink<T>,
    iter: Iterable<T> | Iterator<T>,
  ) {
    this.iterator = isIterable(iter) ? (iter as Iterable<T>)[Symbol.iterator]() : iter
  }

  loop() {
    this.inloop = true
    while (this.got && !this.disposed) {
      this.got = false
      this.last = this.iterator.next()
      if (this.last.done) {
        this.sink.end()
        break
      } else {
        this.sink.receive(this.last.value)
      }
    }
    this.inloop = false
  }

  start() {
    this.disposed = false
  }

  request() {
    this.got = true
    if (
      !this.inloop &&
      !(this.last && this.last.done)
    ) {
      this.loop()
    }
  }

  stop() {
    this.disposed = true
  }
}


export class IterableSource<T> implements Source<T> {
  constructor(
    private iter: Iterable<T> | Iterator<T>,
  ) { }

  connect(sink: Sink<T>) {
    sink.greet(new IterableTalkback(sink, this.iter))
  }
}


export function iterable<T>(iterator: Iterable<T> | Iterator<T>): Source<T> {
  return new IterableSource(iterator)
}
