import { Source, Talkback, Dispose, Sink } from './types'


// FIXME: subjects send data to the sink before they have called the talkback.start() method.

class SubjectTalkback<T> extends Dispose {
  constructor(
    private source: Subject<T>,
    private sink: Sink<T>,
  ) { super() }

  end() {
    const index = this.source.sinks.indexOf(this.sink)

    if (index !== -1) {
      this.source.sinks.splice(index, 1)
    }
  }
}


export class Subject<T> implements Source<T>, Sink<T> {
  done = false
  sinks = <Sink<T>[]> []

  connect(sink: Sink<T>) {
    if (!this.done) {
      this.sinks.push(sink)
      sink.greet(new SubjectTalkback(this, sink))
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
