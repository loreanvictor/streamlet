/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle,
} from '../src'


const S = new Subject<void>()


async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

pipe(
  interval(100),
  throttle(i => i % 2 === 0 ? delay(50) : delay(110)),
  tap(console.log),
  take(5),
  observe,
)
