import { Talkback, Sink, Source } from './types'


export class Observation<T> implements Sink<T> {
  talkback: Talkback | undefined
  started = false

  constructor(private autostart = true) {}

  greet(talkback: Talkback) {
    if (!this.talkback) {
      this.talkback = talkback

      if (this.autostart) {
        this.start()
      }
    }
  }

  receive() {}
  end() {}

  start() {
    if (!this.started && this.talkback) {
      this.talkback.start()
      this.started = true
    }
  }

  stop(reason?: unknown) {
    this.talkback?.end(reason)
  }
}

export function observe<T>(source: Source<T>): Observation<T> {
  const observation = new Observation<T>()
  source.connect(observation)

  return observation
}


export function observeLater<T>(source: Source<T>): Observation<T> {
  const observation = new Observation<T>(false)
  source.connect(observation)

  return observation
}
