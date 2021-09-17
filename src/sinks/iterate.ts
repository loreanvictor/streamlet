import { Sink, Source, Talkback } from '../types'


export class Iteration<T> implements Sink<T>, Talkback {
  talkback: Talkback | undefined
  started = false

  constructor(private autostart = false) {}

  greet(talkback: Talkback) {
    if (!this.talkback) {
      this.talkback = talkback

      if (this.autostart) {
        this.start()
      }
    }
  }

  receive() {
    this.talkback?.request()
  }

  request() { this.talkback?.request() }
  end() {}

  start() {
    if (!this.started && this.talkback) {
      this.started = true
      this.talkback.start()
      this.talkback.request()
    }
  }

  stop() {
    this.talkback?.stop()
  }
}


export function iterate<T>(source: Source<T>): Sink<T> {
  const iteration = new Iteration<T>()
  source.connect(iteration)

  return iteration
}


export function iterateLater<T>(source: Source<T>): Sink<T> {
  const iteration = new Iteration<T>(false)
  source.connect(iteration)

  return iteration
}
