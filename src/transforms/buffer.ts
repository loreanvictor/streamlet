import { Source, Sink, Talkback, USourceableFactory, Sourceable } from '../types'
import { from } from '../sources/expr'


export class BufferingSink<T> implements Sink<T>, Talkback {
  readonly buffer: T[] = []
  private ended = false
  private requested = false
  private talkback: Talkback

  constructor(
    private sink: Sink<T>,
    private max: number,
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(this)
  }

  receive(value: T) {
    if (this.requested) {
      this.requested = false
      this.sink.receive(value)
    } else {
      this.buffer.push(value)
      if (this.buffer.length === this.max + 1) {
        this.buffer.shift()
      }
    }
  }

  pull() {
    if (this.buffer.length > 0) {
      this.sink.receive(this.buffer.shift()!)

      if (this.buffer.length === 0 && this.ended) {
        this.sink.end()
      }

      return true
    } else {
      return false
    }
  }

  end(reason?: unknown) {
    if (reason === undefined && this.buffer.length > 0) {
      this.ended = true
    } else {
      this.sink.end(reason)
    }
  }

  start() {
    this.talkback.start()
  }

  request() {
    if (!this.pull()) {
      this.requested = true
      this.talkback.request()
    }
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


export class BufferedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private max: number = -1,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new BufferingSink(sink, this.max))
  }
}


export function buffer(max?: number): USourceableFactory
export function buffer<T>(source: Sourceable<T>, max?: number): Source<T>
export function buffer<T>(source?: Sourceable<T> | number, max?: number): Source<T> | USourceableFactory {
  if (source !== undefined && typeof source !== 'number') {
    return new BufferedSource(from(source), max)
  } else {
    return <U>(src: Sourceable<U>) => buffer(src, source as number)
  }
}
