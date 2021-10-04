import { Source, Sink, Dispose, Handler } from '../types'
import { addListener, removeListener } from '../util/dom-events'


class EventTalkback<EventName extends keyof HTMLElementEventMap>
  extends Dispose {
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
    addListener(this.node, this.name, this.handler, this.options)
  }

  stop() {
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
