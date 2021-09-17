<div align="center">

<img src="./misc/logo-cutout.svg" width="128px"/>
  
# Streamlets

</div>
  
```bash
npm i streamlets
```
  
Streamlets are light-weight streams of data, following the _streamlet_ protocol. The protocol is designed to handle synchronous, asynchronous, listenable and pullable data streams simultaenously (as much as possible), while being easy and straightforward to build upon, and minimizing any overhead for handling such data streams.

> If you know [RxJS](https://rxjs.dev), this is just like RxJS but a bit more lightweight and more versatile, also less battle-tested, less utilities, generally more experimental. If you know [callbags](https://github.com/callbag/callbag), this is basically a simplified version of the callbag standard. In any case, if you are looking for a tool to use on production, I highly encourage looking at any of those two options.

```js
import { pipe, interval, tap, observe } from 'streamlets'

pipe(
  interval(1000),
  tap(console.log),
  observe,
)
```

_or with the [hopefully soon-ish to land pipelines](https://github.com/tc39/proposal-pipeline-operator)_:

```js
import { interval, tap, observe } from 'streamlets'

interval(1000)
  |> tap(^, console.log)
  |> observe(^)
```

## Protocol

Streamlets are made up of three primary primitives:

- **Sources**, who generate data (or respond with data when requested)
- **Sinks**, who consume data (and can ask for more data)
- **Talkbacks**, which allow **Sinks** to talk to **Sources**

```ts
interface Source<T> {
  connect(sink: Sink<T>)
}

interface Sink<T> {
  greet(talkback: Talkback)
  receive(data: T)
  end(reason?: unknown)
}

interface Talkback {
  start()
  request()
  stop(reason?: unknown)
}
```

Typically, these primitives work with each other as follows:

1. A sink _connects_ to a source
```js
source.connect(sink)
```
2. The source MUST _greet_ the sink with a talkback
```js
// inside the source
sink.greet(talkback)
```
3. The sink MAY ask the source (via the talkback) to _start_ sending data, whenever it is ready
```js
// inside the sink
talkback.start()
```
4. The sink MAY now _receive_ data from the source
```js
// inside the source
sink.receive(data)
```
6. The sink MAY also _request_ more data (via the talkback)
```js
// inside the sink
talkback.request()
```
8. The sink MAY ask the source (via the talkback) to _stop_ sending more data. It might also provide a reason for this (i.e. error)
```js
// inside the sink
talkback.stop()
```
10. The source MAY signal the _end_ of the data to the sink. It might also provide a reason for this (i.e. error)
```js
// inside the source
sink.end()
```

Following rules should apply:

- Sinks MUST be greeted with a talkback from the source, when they are connected
- Sinks MUST NOT receive any data before the source greets them with a talkback
- Sinks MUST NOT receive any data before they asked the source to start
- Sinks MUST NOT receive any data after they have asked the source to stop
- Sinks MUST NOT receive any data after the source has claimed an end to the data

For example, this is a sink that takes five data pieces from a given source and logs them:
```ts
class LogFive implements Sink<any> {
  talkback: Talkback
  received = 0

  greet(talkback) {
    this.talkback = talkback
    talkback.start()                   // --> start the stream
    talkback.request()                 // --> also ask for data, in case the source doesn't push data on its own
  }
  
  receive(data) {
    console.log(data)                  // --> log the data
    if (++this.received === 5) {       // --> if we've got enough data ...
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
```

Or this is a source (and its corresponding talkback) that announces the date and time to its sinks every second:

```ts
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
  sinks = []
  interval: NodeJS.Timer
  
  constructor() {
    this.interval = setInterval(() => {
      const date = new Date()
      this.sinks.forEach(sink => sink.receive(date))     // --> inform all plugged-in sinks of the date and time
    }, 1000)
  }
  
  connect(sink) {
    sink.greet(new TimeTalkback(this, sink))             // --> give the sink the means to plug itself in
  }
  
  plug(sink) {
    this.sinks.push(sink)
  }
  
  unplug(sink) {
    this.sinks = this.sinks.filter(s => s !== sink)
    if (this.sinks.length === 0) {                       // --> no one is listening anymore ...
      clearInterval(this.interval)                       // --> ... let's close shop
    }
  }
}
```

And now we could combine the two:

```ts
const source = new TimeSource()
const sink = new LogFive()

source.connect(sink)

// > 2021-09-17T17:57:30.424Z
// > 2021-09-17T17:57:31.424Z
// > 2021-09-17T17:57:32.427Z
// > 2021-09-17T17:57:33.428Z
// > 2021-09-17T17:57:34.434Z
```
