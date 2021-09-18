<div align="center">

<img src="./misc/logo-cutout.svg" width="128px"/>
  
# Streamlets

</div>
  
```bash
npm i streamlets
```
  
Streamlets are light-weight streams of data, following the _streamlet_ protocol. The protocol is designed to handle synchronous, asynchronous, listenable and pullable data streams seamlessly, be easy and straightforward to build upon, and minimize any overhead for handling data streams.

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

<br><br>

# Protocol

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
import { sink } from 'streamlets'

const logfive = () => {
  let received = 0
  let talkback

  return sink({
    greet: _talkback => (talkback = _talkback).start(),  // --> start the data when got the talkback
    receive: data => {
      console.log(data)                                  // --> log incoming data
      if (++received === 5) talkback.stop()              // --> stop data when we've got enough
    }
  })
}
```

And this is a source (and its corresponding talkback) that announces the date and time to its sinks every second:

```ts
import { source, talkback } from 'streamlets'

const timer = () => {
  const sinks = []
  setInterval(() => sinks.forEach(
    sink => sink.receive(new Date())                      // --> inform all sinks of the date every second
  ), 1000)

  return source(
    sink => sink.greet(                                   // --> greet incoming sinks ...
      talkback({                                          // ... with a talkback ...
        start: () => sinks.push(sink),                    // ... plug them into sinks when they want to start
        stop: () => sinks.splice(sinks.indexOf(sink), 1)  // ... remove them from sinks when they want to stop
      })
    )
  )
}
```

And now we could combine the two:

```ts
const source = timer()
const sink = logfive()

source.connect(sink)

// > 2021-09-17T17:57:30.424Z
// > 2021-09-17T17:57:31.424Z
// > 2021-09-17T17:57:32.427Z
// > 2021-09-17T17:57:33.428Z
// > 2021-09-17T17:57:34.434Z
```
Note that in this example, our sink (`logfive()`) did not explicitly request any data, and our source would push data without being requested.
Sources can also be _pullable_, i.e. they might wait for the sink to request data before sending it.
