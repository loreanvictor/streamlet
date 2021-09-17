import { isSource, isTalkback, Source, Talkback } from '../types'
import { notify } from '../sinks/notify'
import { noop } from './noop'


export type WaitNotifier = number | Source<any> | PromiseLike<any>
export type WaitIndicator<T> = (t: T) => WaitNotifier

type AbortSignal = { aborted: boolean }
export type Waiting = NodeJS.Timeout | Talkback | AbortSignal


function isAbortSignal(thing: unknown): thing is AbortSignal {
  return !!thing && typeof (thing as any).aborted === 'boolean'
}

export function resolveWait<T>(indicator: WaitIndicator<T> | WaitNotifier, t: T): WaitNotifier {
  return typeof indicator === 'function' ? indicator(t) : indicator
}


export function wait(callback: () => void, notif: WaitNotifier): Waiting {
  if (typeof notif === 'number') {
    return setTimeout(callback, notif)
  } else if (isSource(notif)) {
    return notify(notif, callback)
  } else {
    const signal = { aborted: false }
    notif.then(() => {
      if (!signal.aborted) {
        callback()
      }
    }, noop)

    return signal
  }
}


export function stopWaiting(waiting: Waiting) {
  if (isTalkback(waiting)) {
    waiting.stop()
  } else if (isAbortSignal(waiting)) {
    waiting.aborted = true
  } else {
    clearTimeout(waiting)
  }
}
