/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate,
} from '../src'


const random = source<number>(
  s => s.greet(
    talkback({
      request: () => s.receive(Math.random())
    })
  )
)


pipe(
  random,
  pullrate(1000),
  tap(console.log),
  iterate,
)
