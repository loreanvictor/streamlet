export interface Source<T> {
  connect(sink: Sink<T>): void
}

export interface Sink<T> {
  greet(talkback: Talkback): void
  receive(data: T): void
  end(reason?: unknown): void
}

export interface Talkback {
  start(): void
  request(): void
  end(reason?: unknown): void
}

export type UnwrapSource<T extends Source<any>> = T extends Source<infer R> ? R : never
export type UnwrapSink<T extends Sink<any>> = T extends Sink<infer R> ? R : never

export abstract class Dispose implements Talkback {
  start() {}
  request() {}
  abstract end(): void
}
