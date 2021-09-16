import { Sink, Source, Talkback } from './types'


export class GreetedSink<T> implements Sink<T> {
  constructor(
    private sink: Sink<T>,
    private op: (talkback: Talkback) => void,
  ) { }

  greet(talkback: Talkback) {
    this.op(talkback)
    this.sink.greet(talkback)
  }

  receive(data: T) {
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    this.sink.end(reason)
  }
}


export class GreetedSource<T> implements Source<T> {
  constructor(
    private source: Source<T>,
    private op: (talkback: Talkback) => void,
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new GreetedSink(sink, this.op))
  }
}


export function greet<T>(op: (talkback: Talkback) => void): (source: Source<T>) => Source<T> {
  return (source: Source<T>) => new GreetedSource(source, op)
}
