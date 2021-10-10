/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer, distinct, connectRate,
} from '../src'


pipe(
  iterable([
    iterable([1, 2, 3]),
    iterable([4, 5, 6]),
  ]),
  flatten,
  tap(console.log),
  iterate
)

// pipe(
//   fetch('http://xkcd.com/info.0.json'),
//   pullrate(5000),
//   connectRate(1000),
//   tap(() => console.log('XKCD is online!')),
//   finalize(() => console.log('XKCD is offline!')),
//   retry,
//   iterate
// )
