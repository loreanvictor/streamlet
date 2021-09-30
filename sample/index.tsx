/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry, stream, pullBuffer,
} from '../src'


const pauser = () => {
  let rec = 0
  let tb: Talkback

  return sink({
    greet(_tb) {
      tb = _tb
      tb.start()
    },
    receive() {
      rec++
      if (rec === 2) {
        console.log('---[ PAUSE ]---')
        tb.stop()
        setTimeout(() => {
          console.log('---[ RESUME ]---')
          tb.start()
        }, 1000)
      }
    }
  })
}


const timer = share(interval(200))
observe(timer)
pipe(
  timer, tap(console.log), connect(pauser())
)
