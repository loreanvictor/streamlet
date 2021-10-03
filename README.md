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

Streamlet is a protocol for handling streams of data.

- ↕️ It allows for handling pullables (i.e. iterables), listenables (i.e. observables) and anything in between.
- ⛓️ It allows for handling synchronous and asynchronous data sources.
- ⏯️ It enables pausing / resuming streams.
- 📦 It allows pretty light-weight primitives and tools.

<br>

The `streamlets` package includes typings and tools built around this protocol.

```js
import { pipe, interval, tap, observe } from 'streamlets'

const obs = 
  pipe(
    interval(1000),
    tap(console.log),
    observe,
  )


setTimeout(() => obs.stop(), 2000)
setTimeout(() => obs.start(), 4000)

// > 0
// > 1
// ... pausde for two seconds, no logs ...
// > 2
// > 3
// > ...
```

<br><br>

# Protocol

Streamlets are made up of three primary primitives:

- **Sources**, who generate data (or respond with data when requested)
- **Sinks**, who consume data (and can ask for more data)
- **Talkbacks**, which allow **Sinks** to talk to **Sources**

```ts
interface Source<T> {
  connect(sink: Sink<T>)     // --> called by outside code, connects a source and a sink
}

interface Sink<T> {
  greet(talkback: Talkback)  // --> called by the source, gives the sink a way of communicating back
  receive(data: T)           // --> called by the source, sends some data to the sink
  end(reason?: unknown)      // --> called by the source, sends an end signal to the sink
}

interface Talkback {
  start()                    // --> called by the sink, tells the source to start sending data
  request()                  // --> called by the sink, asks the source for more data
  stop(reason?: unknown)     // --> called by the sink, asks the source to stop sending more data
}
```

1. A source **MUST** greet a sink with a talkback after they are connected. A source **MAY** greet a connected sink synchronously or asynchronously.
2. A source **MAY** send data or an end signal to a sink, **IF AND ONLY IF** all of the following hold:
    - The sink was connected to the source.
    - The source has greeted the sink with a talkback.
    - The sink has started the talkback at least once.
    - The sink has not stopped the talkback after the last time it has started it.
    - The source has not already sent an end signal to the sink.
3. A source **MAY** provide additional reasons for the end signal (i.e. error). Similarly, a sink **MAY** provide additional reasons for why it is stopping the stream.
4. A sink **MAY** request for more data using its talkback, **IF AND ONLY IF** all of the conditions of (2) hold.

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

# Prior Work

If you find this useful, you most probably want to use [RxJS](https://rxjs.dev/). This is an experimental work.
If you are into these kinds of experiments, checkout [the callbag standard](https://github.com/callbag/callbag) as well.
The main differences between streamlets and aforementioned libraries are:

- Streamlets handle both pullables and listenables, and anything in between. Callbags do the same, RxJS does not.
- Streamlets support pausing / resuming by default. This [can be added](https://github.com/erikras/callbag-pausable) to callbags as well, not supported by the standard itself. RxJS does not support this.
- Streamlets and callbags are pretty light-weight. RxJS operators and utilities are way heavier than both.

<div align="center">

primitive / utility        | Streamlet | Callbag | RxJS
-------------------------- | --------- | ------- | ------
`interval()`               | 366B      | 200B    | 4.6kB
`merge()`                  | 535B      | 336B    | 5.9kB
`map()`                    | 390B      | 198B    | 3.5kB
`flatten()` / `switchMap()`| 532B      | 288B    | 5.0kB

</div>

- I am hoping streamlets are at least as fast and consume much less memory than both RxJS observables and callbags. I need some benchmarking to make sure of this though.

<br><br>

# Acknowledgement

The streamlet protocol is heavily influenced by [the callbag standard](https://github.com/callbag/callbag). A lot of code and utilities built around callbags were directly adopted into utilities for streamlets, including (but not limited to):
- [callbag-from-iter](https://github.com/staltz/callbag-from-iter), [callbag-flatten](https://github.com/staltz/callbag-flatten), and lots of other callbag related utilities by [@staltz](https://github.com/staltz)
- [callbag-of](https://github.com/Andarist/callbag-of) and [callbag-retry](https://github.com/Andarist/callbag-retry) by [@Andarist](https://github.com/Andarist)
- [callbag-start-with](https://github.com/krawaller/callbag-start-with) by [@krawaller](https://github.com/krawaller)
- [callbag-debounce](https://github.com/atomrc/callbag-debounce) by [@atomrc](https://github.com/atomrc)
