/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer,
} from '../src'


const src = pipe(interval(100), tap(console.log))
const obs = observe(src)

setTimeout(() => obs.stop(), 600)
setTimeout(() => obs.start(), 2000)
