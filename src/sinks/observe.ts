import { Talkback, Sink, Sourceable } from '../types'
import { from } from '../sources/expr'


export class Observation<T> implements Sink<T>, Talkback {
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

  receive() {}

  end() {
    this.started = false
    this.talkback = undefined
  }

  request() {
    this.start()
    this.talkback?.request()
  }

  start() {
    if (!this.started) {
      this.started = true
      this.talkback?.start()
    }
  }

  stop(reason?: unknown) {
    if (this.started) {
      this.started = false
      this.talkback?.stop(reason)
    }
  }
}

export function observe<T>(source: Sourceable<T>): Observation<T> {
  const observation = new Observation<T>()
  from(source).connect(observation)

  return observation
}


export function observeLater<T>(source: Sourceable<T>): Observation<T> {
  const observation = new Observation<T>(false)
  from(source).connect(observation)

  return observation
}
