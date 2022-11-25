import { Source, Sink, Talkback, Handler, Sourceable, SourceableSinkFactory } from '../types'
import { from } from '../sources/expr'


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

  end() {}

  start() { this.talkback?.start() }
  request() { this.talkback?.request() }
  stop(reason?: unknown) { this.talkback?.stop(reason) }
}


export function notify<T>(handler: Handler<T>): SourceableSinkFactory<T, Notification<T>>
export function notify<T>(source: Sourceable<T>, handler: Handler<T>): Notification<T>
export function notify<T>(source: Handler<T> | Sourceable<T>, handler?: Handler<T>) {
  if (handler !== undefined) {
    const src = from(source as Sourceable<T>)
    const notification = new Notification(handler)
    src.connect(notification)

    return notification
  } else {
    return (src: Source<T>) => notify(src, source as Handler<T>)
  }
}
