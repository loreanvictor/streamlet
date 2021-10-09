/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer, distinct,
} from '../src'


const o = pipe(
  interval(1000),
  map(i => pipe(interval(200), map(x => `${i}:${x}`))),
  flatten,
  tap(console.log),
  observe,
)

setTimeout(() => o.stop(), 2400)
setTimeout(() => o.start(), 5000)
