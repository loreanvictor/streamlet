/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer,
} from '../src'


const src = share(interval(1000))
observe(src)
const o = pipe(src, tap(console.log), observe)

setTimeout(() => o.stop(), 2000)
setTimeout(() => o.start(), 4000)
