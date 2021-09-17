/* eslint-disable no-unused-expressions */
import { Talkback } from '../types'


export class CustomTalkback implements Talkback {
  constructor(private readonly def: Partial<Talkback>) { }

  start() { this.def.start && this.def.start() }
  request() { this.def.request && this.def.request() }
  stop(reason?: unknown) { this.def.stop && this.def.stop(reason) }
}


export function talkback(def: Partial<Talkback>): Talkback {
  return new CustomTalkback(def)
}
