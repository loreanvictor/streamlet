import { DataMultiplexer, EndMultiplexer } from '..'
import { Source, Sink, Talkback, DisconnectableSource } from '../types'


class SharedTalkback<T> implements Talkback {
  constructor(
    private source: SharedSource<T>,
    private sink: Sink<T>,
  ) { }

  start() {
    this.source.plug(this.sink)
    this.source.start()
  }

  request() {
    this.source.talkback.request()
  }

  stop() {
    this.source.disconnect(this.sink)
  }
}


class SharedSink<T> implements Sink<T> {
  constructor(
    private source: SharedSource<T>,
  ) { }

  greet(talkback: Talkback) {
    this.source.talkback = talkback
  }

  receive(t: T) {
    this.source.dataMux.send(t)
  }

  end(reason?: unknown) {
    this.source.endMux.send(reason)
    this.source.sinks.length = 0
    this.source.started = false
  }
}


export class SharedSource<T> extends DisconnectableSource<T> {
  sinks: Sink<T>[] = []
  dataMux = new DataMultiplexer<T>(this.sinks)
  endMux = new EndMultiplexer(this.sinks)
  sink: SharedSink<T>
  talkback: Talkback
  started = false

  constructor(
    private source: Source<T>
  ) { super() }

  connect(sink: Sink<T>) {
    sink.greet(new SharedTalkback(this, sink))
  }

  start() {
    if (!this.started && this.talkback) {
      this.started = true
      this.talkback.start()
    }
  }

  plug(sink: Sink<T>) {
    this.sinks.push(sink)

    if (this.sinks.length === 1 && !this.sink) {
      this.sink = new SharedSink(this)
      this.source.connect(this.sink)
    }
  }

  disconnect(sink: Sink<T>) {
    const index = this.sinks.indexOf(sink)

    if (index !== -1) {
      this.sinks.splice(index, 1)
    }

    if (this.sinks.length === 0) {
      this.started = false
      this.talkback?.stop()
    }
  }
}


export function share<T>(source: Source<T>): SharedSource<T> {
  return new SharedSource(source)
}
