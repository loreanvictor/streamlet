<div align="center">

<img src="./misc/logo-cutout.svg" width="128px"/>
  
# Streamlets

</div>
  
```bash
npm i streamlets
```

[![tests](https://img.shields.io/github/workflow/status/loreanvictor/streamlet/Test%20and%20Report%20Coverage?label=tests&logo=mocha&logoColor=green)](https://github.com/loreanvictor/streamlet/actions?query=workflow%3A%22Test+and+Report+Coverage%22)
[![coverage](https://app.codacy.com/project/badge/Coverage/95822ae988d14ef3957704b31372d24e)](https://www.codacy.com/gh/loreanvictor/streamlet/dashboard?utm_source=github.com&utm_medium=referral&utm_content=loreanvictor/streamlet&utm_campaign=Badge_Coverage)
[![version](https://img.shields.io/npm/v/streamlets?logo=npm)](https://www.npmjs.com/package/streamlets)
<!--
[![coverage](https://img.shields.io/codecov/c/github/loreanvictor/streamlet?logo=codecov)](https://codecov.io/gh/loreanvictor/streamlet)
-->

Streamlets are light-weight streams of data, following the _streamlet_ protocol. The protocol is designed to handle synchronous, asynchronous, listenable and pullable data streams seamlessly, be easy and straightforward to build upon, and minimize any overhead for handling data streams.

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
2. The source MUST _greet_ the sink with a talkback (not necessarily synchronously)
```js
// inside the source
sink.greet(talkback)
```
3. The sink MAY ask the source (via the talkback) to _start_ sending data
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
- Sinks MUST NOT receive any data after they have asked the source to stop, unless the sink asks the source to start again
- Sinks MUST NOT receive any data after the source has claimed an end to the data
- Sinks MUST NOT request further data before they have been greeted and asked the source to start sending data
- Sinks MUST NOT request further data after they have asked the source to stop or the source has signaled end of data

<br><br>

# Examples

This is a sink that takes five data pieces from a given source and logs them:
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
Note that in this example, our sink (`logfive()`) did not explicitly request any data, and `timer()` would push data without being requested. This type of source is called _listenable_. Sources can also be _pullable_, i.e. they might wait for the sink to request data before sending it. For example, here we have a source that responds with a random number whenever a sink requests data:
```ts
import { source, talkback } from 'streamlets'

const random = source(
  sink => sink.greet(talkback({
    request: () => sink.receive(Math.random())
  })
)
```
Connecting this source with `logfive()` would result in nothing, since `logfive()` doesn't request data and `random` waits for requests. We can update `logfive()` as follows to make it work with _pullable_ sources:
```ts diff
import { sink } from 'streamlets'

const logfive = () => {
  let received = 0
  let talkback

  return sink({
    greet: _talkback => {
      (talkback = _talkback).start()
      talkback.request()                                 // --> also request data to be sent
    },
    receive: data => {
      console.log(data)
      if (++received === 5) talkback.stop()
      else talkback.request()                            // --> request more data when needed
    }
  })
}
```
Which could now also be connected to `random` successfully:
```js
random.connect(logfive())

// > 0.030974256671512546
// > 0.8947308755278609
// > 0.5683259310267721
// > 0.9542027116808698
// > 0.8944987662953441
```

<br><br>

# Why Should I Use Streamlets Over X?

This is work in progress, so definitely DO NOT USE IT IN PRODUCTION (maybe wait until `0.1.0` rolls out). Besides that, this is an experimental library still, so use at your own discretion. Most probably, the advantages it has over established libraries like RxJS really aren't important for you, and the fact that it is NOT a battle-tested library, it does not comply with the Observable API, it does not have a community built around it or maintaining and improving it, etc. will bite you back.

That said, these are the areas where streamlets perhaps have an advantage over established solutions:

- Streamlet protocol handles both listenable (e.g. Observable) and pullable (e.g. Iterable) sources, alongside anything in between. You can, for example, have a source that pushes values for 10 seconds after it connects to a sink, and waits for the sink to pull for pushing values for another 10 seconds.
- Streamlet sources are mostly pausable/resumable by default (a sink can ask the source to stop and to start later).
- Streamlet protocol allows for custom sinks. You can have a sink that pauses the source when-ever a buffer is filled up and resumes it after the buffer is emptied.
- Streamlets are _really_ light-weight (`map()` of RxJS weighs about 3.5K, while `map()` of streamlets weighs about 350B).
- Streamlets are (or ideally should be) _really_ fast and light on memory. One of my main goals for building them is to have reactive primitives that I can abuse with ease of mind (imagine every single state variable in an app being a stream).
