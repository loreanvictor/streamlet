import { Source, Sink, Dispose, Handler } from '../types'
import { addListener, removeListener } from '../util/dom-events'


// TODO: test this

class EventTalkback<EventName extends keyof HTMLElementEventMap>
  extends Dispose {
  disposed = false
  handler: Handler<HTMLElementEventMap[EventName]>

  constructor(
    private sink: Sink<HTMLElementEventMap[EventName]>,
    readonly node: EventTarget,
    readonly name: EventName,
    readonly options?: boolean | AddEventListenerOptions,
  ) {
    super()
    this.handler = evt => this.sink.receive(evt)
  }

  start() {
    if (!this.disposed) {
      addListener(this.node, this.name, this.handler, this.options)
    }
  }

  stop() {
    this.disposed = true
    removeListener(
      this.node,
      this.name,
      this.handler,
      this.options
    )
  }
}


export class EventSource<EventName extends keyof HTMLElementEventMap>
implements Source<HTMLElementEventMap[EventName]> {
  constructor(
    readonly node: EventTarget,
    readonly name: EventName,
    readonly options?: boolean | AddEventListenerOptions,
  ) { }

  connect(sink: Sink<HTMLElementEventMap[EventName]>) {
    sink.greet(new EventTalkback(sink, this.node, this.name, this.options))
  }
}


export function event<EventName extends keyof HTMLElementEventMap>(
  node: EventTarget,
  name: EventName,
  options?: boolean | AddEventListenerOptions,
): Source<HTMLElementEventMap[EventName]> {
  return new EventSource(node, name, options)
}
