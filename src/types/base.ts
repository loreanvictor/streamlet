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
