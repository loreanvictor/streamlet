import { Source, Sink, Talkback, USourceFactory } from '../types'


// TODO: test this

export class PullBufferTalkback<T> implements Talkback {
  requested = false

  constructor(
    private sink: PullBufferSink<T>,
    private talkback: Talkback,
  ) {}

  start() {
    this.talkback.start()
  }

  request() {
    if (!this.sink.pull()) {
      this.requested = true
      this.talkback.request()
    }
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
  }
}


export class PullBufferSink<T> implements Sink<T> {
  readonly buffer: T[] = []
  private talkback: PullBufferTalkback<T>

  constructor(
    private sink: Sink<T>,
    private max: number = 1,
  ) {}

  greet(talkback: Talkback) {
    this.talkback = new PullBufferTalkback(this, talkback)
    this.sink.greet(this.talkback)
  }

  receive(value: T) {
    if (this.talkback.requested) {
      this.talkback.requested = false
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

      return true
    } else {
      return false
    }
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class PullBufferSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private max: number = 1,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new PullBufferSink(sink, this.max))
  }
}


export function pullBuffer(max: number): USourceFactory
export function pullBuffer<T>(source: Source<T>, max: number): Source<T>
export function pullBuffer<T>(source: Source<T> | number, max?: number): Source<T> | USourceFactory {
  if (source !== undefined && typeof source !== 'number') {
    return new PullBufferSource(source, max)
  } else {
    return <U>(src: Source<U>) => pullBuffer(src, source as number)
  }
}
