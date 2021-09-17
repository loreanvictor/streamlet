/* eslint-disable @typescript-eslint/no-unused-vars */

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  Source, Talkback, Sink
} from '../src'


class LogFive implements Sink<any> {
  talkback: Talkback
  received = 0

  greet(talkback: Talkback) {
    this.talkback = talkback
    talkback.start()                   // --> start the stream
    talkback.request()                 // --> also ask for data, in case the source doesn't push data on its own
  }

  receive(data: any) {
    console.log(data)                  // --> log the data
    if (++this.received === 5) {            // --> if we've got enough data ...
      this.talkback.stop()             // --> ... ask the source to stop
    }
  }

  end(reason?: unknown) {
    if (reason) {
      console.log('ERROR:: ' + reason) // --> there was an error
    } else {
      console.log('Did not get enough data, but thats ok')
    }
  }
}


class TimeTalkback implements Talkback {
  constructor(
    private source: TimeSource,
    private sink: Sink<Date>,
  ) { }

  start() { this.source.plug(this.sink) }                // --> when the sink wants to start, plug it in
  request() { }
  stop() { this.source.unplug(this.sink) }               // --> when the sinks wants to stop, plug it out
}

class TimeSource implements Source<Date> {
  sinks: Sink<Date>[] = []
  interval: NodeJS.Timer

  constructor() {
    this.interval = setInterval(() => {
      const date = new Date()
      this.sinks.forEach(sink => sink.receive(date))     // --> inform all plugged-in sinks of the date and time
    }, 1000)
  }

  connect(sink: Sink<Date>) {
    sink.greet(new TimeTalkback(this, sink))        // --> give the sink the means to plug itself in
  }

  plug(sink: Sink<Date>) {
    this.sinks.push(sink)
  }

  unplug(sink: Sink<Date>) {
    this.sinks = this.sinks.filter(s => s !== sink)
    if (this.sinks.length === 0) {
      clearInterval(this.interval)
    }
  }
}


const source = new TimeSource()
const sink = new LogFive()
source.connect(sink)
