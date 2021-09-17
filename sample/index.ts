/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback
} from '../src'


const logFive = <T>(src: Source<T>) => {
  let received = 0
  let _talkback: Talkback

  src.connect(sink({
    greet: tb => {
      _talkback = tb
      tb.start()
      tb.request()
    },
    receive: d => {
      console.log(d)
      if (++received === 5) {
        _talkback.stop()
      }
    }
  }))
}

const timer = () => {
  const sinks: Sink<Date>[] = []
  const handle = setInterval(() => sinks.forEach(s => s.receive(new Date())), 1000)

  return source(s => s.greet(talkback({
    start: () => sinks.push(s),
    stop: () => {
      sinks.splice(sinks.indexOf(s), 1)
      if (sinks.length === 0) {
        clearInterval(handle)
      }
    }
  })))
}


logFive(timer())
