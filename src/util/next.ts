import { from } from '../sources/expr'
import { Sink, Talkback, Sourceable } from '../types'
import { Deferred } from '../util'


class NextSink<T> implements Sink<T>, Talkback {
  deferred: Deferred<T>
  talkback: Talkback
  sync = true
  disposed = false
  buffer: {value?: T, error?: unknown, failed: boolean}[]

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.deferred = new Deferred<T>()
    this.buffer = []

    this.talkback.start()
    this.talkback.request()

    this.sync = false
  }

  receive(value: T) {
    if (this.sync) {
      this.buffer.push({value, failed: false})
    } else {
      this.deferred.resolve(value)
    }
  }

  end(error?: unknown) {
    this.disposed = true
    if (error !== undefined) {
      if (this.sync) {
        this.buffer.push({failed: true, error})
      } else {
        this.deferred.reject(error)
      }
    }
  }

  start() { }
  request() {
    this.deferred = new Deferred<T>()
    this.talkback.request()
  }

  stop(reason?: unknown) { this.talkback.stop(reason) }
}


export async function* next<T>(source: Sourceable<T>) {
  const sink = new NextSink<T>()

  try {
    from(source).connect(sink)

    while(sink.buffer.length > 0) {
      const pack = sink.buffer.shift()!

      if (pack.failed) {
        throw pack.error!
      } else {
        yield pack.value!
      }
    }

    while(true) {
      if (sink.disposed) {
        return
      } else {
        yield await sink.deferred.promise
        sink.request()
      }
    }
  } finally {
    sink.stop()
  }
}
