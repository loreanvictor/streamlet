import { Sink } from '../types'


export abstract class Multiplexer<T, O=T, S extends Sink<T> = Sink<T>> {
  constructor(
    readonly sinks: S[],
    readonly inline = false,
  ) {}

  protected abstract act(sink: S, options: O): void

  send(options: O) {
    const copy = this.inline ? this.sinks : this.sinks.slice(0)
    for (let i = 0; i < copy.length; i++) {
      const sink = copy[i]
      if (this.inline || this.sinks.indexOf(sink) !== -1) {
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
