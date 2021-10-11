import { DataMultiplexer, EndMultiplexer } from '..'
import { Talkback, Dispose, Sink, DisconnectableSource } from '../types'


class SubjectTalkback<T> extends Dispose {
  constructor(
    private source: Subject<T>,
    private sink: Sink<T>,
  ) { super() }

  start() { this.source.plug(this.sink) }
  request() { this.source.request() }
  stop() { this.source.disconnect(this.sink) }
}


export class Subject<T> extends DisconnectableSource<T> implements Sink<T>, Talkback {
  done = false
  sinks = <Sink<T>[]> []
  talkback: Talkback
  dataMux =  new DataMultiplexer<T>(this.sinks)
  endMux = new EndMultiplexer(this.sinks)

  connect(sink: Sink<T>) {
    if (!this.done) {
      sink.greet(new SubjectTalkback(this, sink))
    }
  }

  plug(sink: Sink<T>) {
    if (!this.done) {
      this.sinks.push(sink)
    }
  }

  disconnect(sink: Sink<T>) {
    const index = this.sinks.indexOf(sink)

    if (index !== -1) {
      this.sinks.splice(index, 1)
    }
  }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.start()
  }

  receive(t: T) {
    this.dataMux.send(t)
  }

  end(reason?: unknown) {
    this.endMux.send(reason)
    this.done = true
    this.sinks.length = 0
  }

  start() { this.talkback?.start() }
  request() { this.talkback?.request() }
  stop(reason?: unknown) { this.talkback?.stop(reason) }
}
