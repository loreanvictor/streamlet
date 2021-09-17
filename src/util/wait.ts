import { isSource, isTalkback, Source, Talkback } from '../types'
import { notify } from '../sinks/notify'
import { noop } from './noop'


export type WaitNotifier = number | Source<any> | PromiseLike<any>
export type WaitIndicator<T> = (t: T) => WaitNotifier
export type Waiting = NodeJS.Timeout | Talkback | AbortController


export function resolveWait<T>(indicator: WaitIndicator<T> | WaitNotifier, t: T): WaitNotifier {
  return typeof indicator === 'function' ? indicator(t) : indicator
}


export function wait(callback: () => void, notif: WaitNotifier): Waiting {
  if (typeof notif === 'number') {
    return setTimeout(callback, notif)
  } else if (isSource(notif)) {
    return notify(notif, callback)
  } else {
    const controller = new AbortController()
    notif.then(() => {
      if (!controller.signal.aborted) {
        callback()
      }
    }, noop)

    return controller
  }
}


export function stopWaiting(waiting: Waiting) {
  if (isTalkback(waiting)) {
    waiting.stop()
  } else if (waiting instanceof AbortController) {
    waiting.abort()
  } else {
    clearTimeout(waiting)
  }
}
