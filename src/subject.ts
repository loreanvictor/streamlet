import { DisconnectableSource } from './disconnectable'
import { Talkback, Dispose, Sink } from './types'


class SubjectTalkback<T> extends Dispose {
  constructor(
    private source: Subject<T>,
    private sink: Sink<T>,
  ) { super() }

  end() { this.source.disconnect(this.sink) }
}


export class Subject<T> extends DisconnectableSource<T> implements Sink<T> {
  done = false
  sinks = <Sink<T>[]> []

  connect(sink: Sink<T>) {
    if (!this.done) {
      this.sinks.push(sink)
      sink.greet(new SubjectTalkback(this, sink))
    }
  }

  disconnect(sink: Sink<T>) {
    const index = this.sinks.indexOf(sink)

    if (index !== -1) {
      this.sinks.splice(index, 1)
    }
  }

  greet(talkback: Talkback) {
    talkback.start()
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
}
