import { Sink, Source, Talkback } from './types'


// TODO: test this

export class Iteration<T> implements Sink<T> {
  talkback: Talkback | undefined

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.talkback.start()
    this.talkback.request()
  }

  receive() {
    this.talkback?.request()
  }

  end() {}
}


export function iterate<T>(source: Source<T>): Sink<T> {
  const iteration = new Iteration<T>()
  source.connect(iteration)

  return iteration
}
