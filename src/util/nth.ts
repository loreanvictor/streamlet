import { from } from '../sources/expr'
import { Sink, Sourceable, Talkback } from '../types'
import { Deferred } from './deferred'


export class NotEnoughEmissionsError extends Error {
  constructor(public readonly expected: number, public readonly actual: number) {
    super(`Expected at least ${expected > 0 ? expected : 1} emissions, but got ${actual}`)
  }
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


export async function first<T>(source: Sourceable<T>) {
  const sink = new NthSink<T>(1)
  from(source).connect(sink)

  return await sink.deferred.promise
}


export async function last<T>(source: Sourceable<T>) {
  const sink = new NthSink<T>(-1)
  from(source).connect(sink)

  return await sink.deferred.promise
}


export function nth(target: number): <U>(source: Sourceable<U>) => Promise<U>
export async function nth<T>(source: Sourceable<T>, target: number): Promise<T>
export function nth<T>(source: Sourceable<T> | number, target?: number) {
  if (typeof source === 'number') {
    return <U>(src: Sourceable<U>) => nth(src, source)
  } else {
    const sink = new NthSink<T>(target!)
    from(source).connect(sink)

    return sink.deferred.promise
  }
}
