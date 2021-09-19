import { Talkback, Sink, Source, UnwrapSource } from '../types'


class MergedSink<T extends Source<any>[]> implements Sink<UnwrapSource<T[number]>> {
  constructor(
    private sink: Sink<UnwrapSource<T[number]>>,
    private index: number,
    private talkback: MergedTalkback<T>,
  ) {}

  greet(talkback: Talkback) {
    this.talkback.talkbacks[this.index] = talkback
    talkback.start()
  }

  receive(data: UnwrapSource<T[number]>) {
    this.sink.receive(data)
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.talkback.dispose(undefined, this.index)
    } else {
      this.talkback.disconnect(this.index)
    }
  }
}


class MergedTalkback<T extends Source<any>[]> implements Talkback {
  talkbacks: (Talkback | undefined)[] = []
  disposed = false
  endCount = 0

  constructor(
    private sources: T,
    private sink: Sink<UnwrapSource<T[number]>>,
  ) {}

  start() {
    this.disposed = false
    for (let i = 0; i < this.sources.length; i++) {
      if (this.disposed) {
        break
      }

      if (!this.talkbacks[i]) {
        this.sources[i].connect(new MergedSink(this.sink, i, this))
      } else {
        this.talkbacks[i]!.start()
      }
    }
  }

  request() {
    for (let i = 0; i < this.sources.length; i++) {
      this.talkbacks[i]?.request()
    }
  }

  stop(reason?: unknown) {
    this.dispose(reason)
  }

  dispose(reason: undefined | unknown, exempt = -1) {
    this.disposed = true
    for (let i = 0; i < this.sources.length; i++) {
      if (i !== exempt) {
        this.talkbacks[i]?.stop(reason)
      }
    }
  }

  disconnect(index: number) {
    this.talkbacks[index] =  undefined
    if (++this.endCount === this.talkbacks.length) {
      this.sink.end()
    }
  }
}


export class MergedSource<T extends Source<any>[]> implements Source<UnwrapSource<T[number]>> {
  constructor(
    private sources: T,
  ) {}

  connect(sink: Sink<UnwrapSource<T[number]>>): void {
    sink.greet(new MergedTalkback(this.sources, sink))
  }
}


export function merge<T extends Source<any>[]>(...sources: T): Source<UnwrapSource<T[number]>> {
  return new MergedSource(sources)
}
