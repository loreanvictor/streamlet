/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
} from '../src'

pipe(
  combine(
    interval(1000),
    startWith(interval(2000), 'A'),
  ),
  greet(() => console.log('HOLA')),
  tap(console.log),
  take(5),
  finalize(() => console.log('GG')),
  observe,
)
