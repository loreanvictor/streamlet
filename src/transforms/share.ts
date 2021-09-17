import { Source, Sink, Talkback, DisconnectableSource } from '../types'


class SharedTalkback<T> implements Talkback {
  constructor(
    private source: SharedSource<T>,
    private sink: Sink<T>,
  ) { }

  start() {
    this.source.talkback.start()
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
    private sink: Sink<T>,
  ) { }

  greet(talkback: Talkback) {
    this.source.talkback = talkback
    this.sink.greet(talkback)
  }

  receive(t: T) {
    const copy = this.source.sinks.slice(0)
    for (let i = 0; i < copy.length; i++) {
      copy[i].receive(t)
    }
  }

  end(reason?: unknown) {
    const copy = this.source.sinks.slice(0)
    for (let i = 0; i < copy.length; i++) {
      copy[i].end(reason)
    }

    this.source.sinks.length = 0
  }
}


export class SharedSource<T> extends DisconnectableSource<T> {
  sinks: Sink<T>[] = []
  talkback: Talkback

  constructor(
    private source: Source<T>
  ) { super() }

  connect(sink: Sink<T>) {
    this.sinks.push(sink)

    if (this.sinks.length === 1) {
      this.source.connect(new SharedSink(this, sink))
    }

    sink.greet(new SharedTalkback(this, sink))
  }

  disconnect(sink: Sink<T>) {
    const index = this.sinks.indexOf(sink)

    if (index !== -1) {
      this.sinks.splice(index, 1)
    }

    if (this.sinks.length === 0) {
      this.talkback.stop()
    }
  }
}


export function share<T>(source: Source<T>): SharedSource<T> {
  return new SharedSource(source)
}
