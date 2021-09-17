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
  stop(reason?: unknown): void
}


export function isTalkback(thing: unknown): thing is Talkback {
  return !!thing
    && typeof (thing as any).start === 'function'
    && typeof (thing as any).request === 'function'
    && typeof (thing as any).stop === 'function'
}


export function isSource<T>(thing: unknown): thing is Source<T> {
  return !!thing
    && typeof (thing as any).connect === 'function'
}
