import { Talkback } from './base'


export abstract class Dispose implements Talkback {
  start() {}
  request() {}
  abstract end(): void
}
