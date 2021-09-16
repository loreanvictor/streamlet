import { Sink, Source, Talkback } from './types'
import { observe } from './observe'
import { Observation } from '.'
import { DisconnectableSource } from './disconnectable'


const _NO_VAL = {}


class ReplayTalkback<T> implements Talkback {
  constructor(
    private source: ReplayedSource<T>,
    private sink: ReplaySink<T>,
    private talkback: Talkback,
  ) { }

  start() {
    this.talkback.start()
    if (this.source.last !== _NO_VAL) {
      this.sink.receive(this.source.last as T)
    }
  }

  request() { this.talkback.request() }
  end(reason?: unknown) {
    this.talkback.end(reason)
    this.source.disconnect(this.sink)
  }
}


class ReplaySink<T> implements Sink<T> {
  constructor(
    private source: ReplayedSource<T>,
    private sink: Sink<T>,
  ) { }

  greet(talkback: Talkback) {
    this.sink.greet(new ReplayTalkback(this.source, this, talkback))
  }

  receive(data: T) {
    this.source.last = data
    this.sink.receive(data)
  }

  end(reason?: unknown) { this.sink.end(reason) }
}


export class ReplayedSource<T> extends DisconnectableSource<T> {
  last: T | typeof _NO_VAL = _NO_VAL
  sinks = 0
  observation: Observation<T>
  memory: T[] = []

  constructor(
    private source: Source<T>,
  ) {
    super()
    this.observation = observe(this)
  }

  connect(sink: Sink<T>) {
    this.sinks++
    this.source.connect(new ReplaySink(this, sink))
  }

  disconnect(_: Sink<T>) {
    if (--this.sinks === 0) {
      this.observation.stop()
    }
  }
}


export function replay<T>(source: Source<T>) {
  return new ReplayedSource(source)
}
