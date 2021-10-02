import { Sink } from '../types'


export abstract class Multiplexer<T, O=T> {
  constructor(
    readonly sinks: Sink<T>[]
  ) {}

  protected abstract act(sink: Sink<T>, options: O): void

  send(options: O) {
    const copy = this.sinks.slice(0)
    for (let i = 0; i < copy.length; i++) {
      const sink = copy[i]
      if (this.sinks.indexOf(sink) !== -1) {
        this.act(sink, options)
      }
    }
  }
}


export class DataMultiplexer<T> extends Multiplexer<T> {
  constructor(sinks: Sink<T>[]) {
    super(sinks)
  }

  protected act(sink: Sink<T>, data: T) {
    sink.receive(data)
  }
}


export class EndMultiplexer extends Multiplexer<unknown> {
  constructor(sinks: Sink<unknown>[]) {
    super(sinks)
  }

  protected act(sink: Sink<unknown>, reason?: unknown) {
    sink.end(reason)
  }
}
