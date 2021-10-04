/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer,
} from '../src'


const obs = pipe(
  iterable([1, 2, 3, 4]),
  pullrate(1000),
  stream,
  tap(console.log),
  observe
)

setTimeout(() => obs.stop(), 3000)
setTimeout(() => obs.start(), 5000)
