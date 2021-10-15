/* eslint-disable no-unused-expressions */
import { Sink, Talkback } from '../types'


export class CustomSink<T> implements Sink<T> {
  constructor(private readonly def: Partial<Sink<T>>) { }

  greet(talkback: Talkback) { this.def.greet && this.def.greet(talkback) }
  receive(t: T) { this.def.receive && this.def.receive(t) }
  end(reason?: unknown) { this.def.end && this.def.end(reason) }
}


export function sink<T>(def: Partial<Sink<T>>, base?: Sink<T>): Sink<T> {
  if (base) {
    return new CustomSink({
      greet: tb => base.greet(tb),
      receive: t => base.receive(t),
      end: reason => base.end(reason),
      ...def,
    })
  } else {
    return new CustomSink(def)
  }
}
