import { Sink, Source, Talkback } from '../types'


export class Iteration<T> implements Sink<T>, Talkback {
  talkback: Talkback | undefined
  started = false

  constructor(private autostart = true) {}

  greet(talkback: Talkback) {
    if (!this.talkback) {
      this.talkback = talkback

      if (this.autostart) {
        this.start()
      } else if (this.started) {
        this.talkback.start()
      }
    }
  }

  receive() {
    this.talkback?.request()
  }

  request() {
    this.start(false)
    this.talkback?.request()
  }

  end() {
    this.started = false
    this.talkback = undefined
  }

  start(req = true) {
    if (!this.started) {
      this.started = true
      this.talkback?.start()
      if (req) {
        this.talkback?.request()
      }
    }
  }

  stop() {
    if (this.started) {
      this.started = false
      this.talkback?.stop()
    }
  }
}


export function iterate<T>(source: Source<T>): Iteration<T> {
  const iteration = new Iteration<T>()
  source.connect(iteration)

  return iteration
}


export function iterateLater<T>(source: Source<T>): Iteration<T> {
  const iteration = new Iteration<T>(false)
  source.connect(iteration)

  return iteration
}
