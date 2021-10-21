import { Sink, Source, Talkback } from '../types'
import { share } from '../transforms'


export class NotEnoughEmissionsError extends Error {
  constructor(public readonly expected: number, public readonly actual: number) {
    super(`Expected at least ${expected > 0 ? expected : 1} emissions, but got ${actual}`)
  }
}


class Deferred<T> {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
  promise = new Promise((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })
}


class NthSink<T> implements Sink<T> {
  index = 0
  deferred: Deferred<T>
  talkback: Talkback
  last: T

  constructor(readonly target: number) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.deferred = new Deferred()

    this.talkback.start()
    this.talkback.request()
  }

  receive(value: T) {
    this.last = value
    if (++this.index === this.target) {
      this.talkback.stop()
      this.deferred.resolve(value)
    }
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.deferred.reject(reason)
    } else {
      if (this.target === -1 && this.index > 0) {
        this.deferred.resolve(this.last)
      } else {
        this.deferred.reject(new NotEnoughEmissionsError(this.target, this.index))
      }
    }
  }
}


export async function first<T>(source: Source<T>) {
  const sink = new NthSink<T>(1)
  source.connect(sink)

  return await sink.deferred.promise
}


export async function last<T>(source: Source<T>) {
  const sink = new NthSink<T>(-1)
  source.connect(sink)

  return await sink.deferred.promise
}


export function nth(target: number): <U>(source: Source<U>) => Promise<U>
export async function nth<T>(source: Source<T>, target: number): Promise<T>
export function nth<T>(source: Source<T> | number, target?: number) {
  if (typeof source === 'number') {
    return <U>(src: Source<U>) => nth(src, source)
  } else {
    const sink = new NthSink<T>(target!)
    source.connect(sink)

    return sink.deferred.promise
  }
}


export async function* next<T>(source: Source<T>) {
  const shared = share(source)
  while (true) {
    try {
      yield await first(shared)
    } catch (e) {
      if (e instanceof NotEnoughEmissionsError) {
        return
      } else {
        throw e
      }
    }
  }
}
