import { Source, Sink, Talkback, Handler, SinkFactory } from '../types'


export class Notification<T> implements Sink<T>, Talkback {
  private talkback: Talkback | undefined

  constructor(private readonly handle: Handler<T>) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    talkback?.start()
    talkback?.request()
  }

  receive(t: T) {
    this.handle(t)
    this.talkback?.stop()
  }

  // TODO: add error handling (throw received errors)
  end() {}

  start() {}
  request() { this.talkback?.request() }
  stop(reason?: unknown) { this.talkback?.stop(reason) }
}


export function notify<T>(handler: Handler<T>): SinkFactory<T, Notification<T>>
export function notify<T>(source: Source<T>, handler: Handler<T>): Notification<T>
export function notify<T>(source: Handler<T> | Source<T>, handler?: Handler<T>) {
  if (handler !== undefined) {
    const src = source as Source<T>
    const notification = new Notification(handler)
    src.connect(notification)

    return notification
  } else {
    return (src: Source<T>) => notify(src, source as Handler<T>)
  }
}
