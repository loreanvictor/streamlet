/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith
} from '../src'

pipe(
  combine(
    startWith(interval(1000), -1),
    startWith(interval(2000), 'A'),
  ),
  tap(console.log),
  take(5),
  observe,
)
