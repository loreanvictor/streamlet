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
    const copy = this.sinks.slice(0)
    for (let i = 0; i < copy.length; i++) {
      const sink = copy[i]
      if (this.sinks.indexOf(sink) !== -1) {
        sink.receive(t)
      }
    }
  }

  end(reason?: unknown) {
    const copy = this.sinks.slice(0)
    for (let i = 0; i < copy.length; i++) {
      const sink = copy[i]
      if (this.sinks.indexOf(sink) !== -1) {
        sink.end(reason)
      }
    }

    this.done = true
    this.sinks.length = 0
  }

  start() { this.talkback.start() }
  request() { this.talkback.request() }
  stop() { this.talkback.stop() }
}
