import { Sink, Source, Talkback } from '../types'


export class TappedSink<T> implements Sink<T> {
  constructor(
    private sink: Sink<T>,
    private op: (t: T) => void,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(talkback)
  }

  receive(data: T) {
    this.op(data)
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class TappedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private op: (t: T) => void,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new TappedSink(sink, this.op))
  }
}


export function tap<T>(op: (t: T) => void): (source: Source<T>) => Source<T> {
  return (source: Source<T>) => new TappedSource(source, op)
}
