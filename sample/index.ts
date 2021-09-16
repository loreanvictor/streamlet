/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe, interval, map, flatten, observe, take, merge, Subject, tap, greet, filter } from '../src'


pipe(
  pipe(interval(1000), map(() => pipe(interval(100), take(3)))),
  flatten,
  filter(x => x % 2 === 0),
  map(x => x + 1),
  tap(console.log),
  take(5),
  observe,
)

