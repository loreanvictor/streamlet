/* eslint-disable no-unused-expressions */
import { Sink, Talkback } from '../types'


export class CustomSink<T> implements Sink<T> {
  constructor(private readonly def: Partial<Sink<T>>) { }

  greet(talkback: Talkback) { this.def.greet && this.def.greet(talkback) }
  receive(t: T) { this.def.receive && this.def.receive(t) }
  end(reason?: unknown) { this.def.end && this.def.end(reason) }
}


export function sink<T>(def: Partial<Sink<T>>): Sink<T> {
  return new CustomSink(def)
}
