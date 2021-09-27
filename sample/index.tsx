/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer,
} from '../src'



const p = pipe(
  iterable([1, 2, 3, 4, 5]),
  pullBuffer(0),
  pullrate(1000),
  tap(x => console.log(x)),
  iterate,
)
