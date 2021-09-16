/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share,
} from '../src'


pipe(
  pipe(interval(1000), map(() => pipe(interval(100), take(3)))),
  flatten,
  filter(x => x % 2 === 0),
  map(x => x + 1),
  take(5),
  tap(console.log),
  share,
  replay,
  iterate,
)
