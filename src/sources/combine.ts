import { Source, Sink, Talkback } from '../types'


const EMPTY = {}


class CombinedSink<T> implements Sink<T> {
  constructor(
    private index: number,
    private talkback: CombinedTalkback<T>,
  ) { }

  greet(talkback: Talkback) {
    this.talkback.talkbacks[this.index] = talkback
    talkback.start()
  }

  receive(value: T) { this.talkback.relay(value, this.index) }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.talkback.dispose(undefined, this.index)
    } else {
      this.talkback.disconnect(this.index)
    }
  }
}


class CombinedTalkback<T> implements Talkback {
  bufferCounter = 0
  endCounter = 0
  disposed = false
  buffer: (T | typeof EMPTY)[] = []
  talkbacks: (Talkback | undefined)[] = []

  constructor(
    private readonly sources: Source<T>[],
    private readonly sink: Sink<T[]>,
  ) {}

  start() {
    const initial = !this.disposed
    this.disposed = false
    for (let i = 0; i < this.sources.length; i++) {
      if (initial) {
        this.buffer[i] = EMPTY
      }

      if (this.disposed) {
        break
      }

      if (!this.talkbacks[i]) {
        this.sources[i].connect(new CombinedSink(i, this))
      } else {
        this.talkbacks[i]!.start()
      }
    }

    if (this.sources.length === 0) {
      this.sink.receive([])
      this.sink.end()
      this.disposed = true
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

  relay(data: T, index: number) {
    if (this.buffer[index] === EMPTY) {
      this.bufferCounter++
    }

    this.buffer[index] = data
    if (this.bufferCounter === this.sources.length) {
      this.sink.receive(this.buffer as T[])
    }
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
    this.talkbacks[index] = undefined
    if (++this.endCounter === this.sources.length) {
      this.sink.end()
    }
  }
}


export class CombinedSource<T> implements Source<T[]> {
  constructor(
    private readonly sources: Source<T>[],
  ) { }

  connect(sink: Sink<T[]>) {
    sink.greet(new CombinedTalkback(this.sources, sink))
  }
}


type S<T> = Source<T>

export function combine<T1>(s1: S<T1>): S<[T1]>
export function combine<T1, T2>(s1: S<T1>, s2: S<T2>): S<[T1, T2]>
export function combine<T1, T2, T3>(s1: S<T1>, s2: S<T2>, s3: S<T3>): S<[T1, T2, T3]>
export function combine<T1, T2, T3, T4>(s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>): S<[T1, T2, T3, T4]>
export function combine<T1, T2, T3, T4, T5>(s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>, s5: S<T5>)
  : S<[T1, T2, T3, T4, T5]>
export function combine<T1, T2, T3, T4, T5, T6>(s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>, s5: S<T5>, s6: S<T6>)
  : S<[T1, T2, T3, T4, T5, T6]>
export function combine<T1, T2, T3, T4, T5, T6, T7>
(s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>, s5: S<T5>, s6: S<T6>, s7: S<T7>)
  : S<[T1, T2, T3, T4, T5, T6, T7]>
export function combine<T1, T2, T3, T4, T5, T6, T7, T8>
  (s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>, s5: S<T5>, s6: S<T6>, s7: S<T7>, s8: S<T8>)
  : S<[T1, T2, T3, T4, T5, T6, T7, T8]>
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>
  (s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>, s5: S<T5>, s6: S<T6>, s7: S<T7>, s8: S<T8>, s9: S<T9>)
  : S<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>
  (s1: S<T1>, s2: S<T2>, s3: S<T3>, s4: S<T4>, s5: S<T5>, s6: S<T6>, s7: S<T7>, s8: S<T8>, s9: S<T9>, s10: S<T10>)
  : S<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>
export function combine<T>(...sources: Source<T>[]): Source<T[]> {
  return new CombinedSource(sources)
}
