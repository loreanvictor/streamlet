import { Source, Sink, Talkback } from '../types'


class UntilGateSink<T> implements Sink<T>, Talkback {
  talkback: Talkback | undefined
  shouldStart = false

  constructor(
    private readonly sink: UntilSink<T>
  ) { }

  greet(talkback: Talkback) {
    this.talkback = talkback

    if (this.shouldStart) {
      this.start()
    }
  }

  receive() {
    this.talkback!.request()
  }

  end(reason?: unknown) {
    this.sink.dispose(reason)
  }

  start() {
    if (this.talkback) {
      this.shouldStart = false
      this.talkback.start()
      this.talkback.request()
    } else {
      this.shouldStart = true
    }
  }

  request() {}

  stop(reason?: unknown) {
    this.shouldStart = false
    this.talkback!.stop(reason)
  }
}


export class UntilSink<T> implements Sink<T>, Talkback {
  talkback: Talkback
  gateSink: UntilGateSink<T>
  disposed = false

  constructor(
    private sink: Sink<T>,
    private gate: Source<unknown>
  ) { }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.gateSink = new UntilGateSink(this)

    this.gate.connect(this.gateSink)
    this.sink.greet(this)
  }

  receive(value: T) {
    if (!this.disposed) {
      this.sink.receive(value)
    }
  }

  end(reason?: unknown) {
    this.dispose(reason, false)
  }

  dispose(reason?: unknown, fromGate = true) {
    this.disposed = true

    if (!fromGate) {
      this.gateSink.stop(reason)
    }

    this.sink.end(reason)
  }

  start() {
    this.gateSink.start()
    this.talkback.start()
  }

  request() {
    this.talkback.request()
  }

  stop(reason?: unknown) {
    this.talkback.stop(reason)
    this.gateSink.stop(reason)
  }
}


export class UntilSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private gate: Source<unknown>
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new UntilSink(sink, this.gate))
  }
}


export function until(gate: Source<unknown>): <U>(source: Source<U>) => Source<U>
export function until<T>(source: Source<T>, gate: Source<unknown>): Source<T>
export function until<T>(source: Source<T> | Source<unknown>, gate?: Source<unknown>):
  Source<T> | (<U>(src: Source<U>) => Source<U>){
  if (gate) {
    return new UntilSource(source, gate)
  } else {
    return <U>(src: Source<U>) => until(src, source)
  }
}
