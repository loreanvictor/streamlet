<div align="center">

<img src="/misc/logo-cutout.svg" width="128px"/>
  
# Streamlet Protocol

</div>

<br><br>

Streamlet protocol is a protocol for handling data/event streams. It establishes interfaces for some [primary concepts](#primary-concepts)
necessary for handling streams, and some [rules](#rules) of how such primitives should interact with each other. This allows exceeding extensibility as
tools and libraries implementing these interfaces and following the rules of the protocol can seamlessly work together.

The protocol is designed for handling all models of reactive programming: push, pull, push-pull, or any combination of them. It enables communicating with
iterables (lists, arrays, generators, etc) the same way as listenables (events, timers, network streams, etc) or hybrid streams.

The protocol also provides a standardized method of stopping and restarting streams (in effect, pausing and resuming). The protocol DOES NOT require
or guarantee that any data stream following the protocol will have that capability though, as it is up to implementations to support that. For example,
a source might decide to shut down the stream after it receives its first stop signal from the sink. However
the protocol does encourage supporting this capability and makes it rather easy to implement.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document
are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

<br><br>

# Primary Concepts

Streamlets are made up of three primary concepts:

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

<br><br>

# Definitions

- A _source_ is any object satisfying the `Source` interface described above.
- A _sink_ is any object satisfying the `Sink` interface described above.
- A _talkback_ is any object satisfying the `Talkback` interface described above.
- A _stream_ refers to the flow of data from a _source_ to a _sink_. When talking about a _stream_, _the source_ might be used to reference the source which the _stream_ represents the flow of data from, and _the sink_ might be used to reference the sink which the _stream_ represents the flow of data to.
- _A source connects to a sink_, _a sink is connected to a source_, or _a sink and a source are connected_, when `.connect()` method on the source has been invoked
  with the sink as its argument. _A connected sink (of a source)_ is a sink that was connected with the source.
  ```ts
  source.connect(sink)
  ```
- _A source greets a sink (with a talkback)_, or _a sink is greeted (by a source) (with a talkback)_, when the source invokes the `.greet()`
  method of a connected sink with given talkback as its argument.
  ```ts
  sink.greet(talkback)
  ```
- _A sink starts a stream_ or _a stream is started_, when the sink invokes the `.start()` method on the talkback the source has greeted it with.
  ```ts
  talkback.start()
  ```
- _A source sends / emits (data) (to a sink)_, or _a sink receives data / emissions (from a source / stream)_, when the source invokes `.receive()` method on a connected sink.
  ```ts
  sink.receive(42)
  ```
- _A sink requests / pulls data (from a source / stream)_, when the sink invokes `.request()` method on the talkback it was greeted with by the source.
  ```ts
  talkback.request()
  ```
- _A source ends a stream_ when `.end()` method on the sink is called by the source. We say _a reason was provided_ if the method is called with an argument.
  ```ts
  sink.end(reason)
  ```
- _A sink stops a source / stream_, when the sink invokes `.stop()` method on the talkback it was greeted with by the source. We say _a reason was provided_ if the method is called with an argument.
  ```ts
  talkback.stop(reason)
  ```

<br><br>

# Rules

1. A source **MAY** greet a sink with a talkback after they are connected. A source **MAY** greet a connected sink synchronously or asynchronously. A source **MUST NOT** greet a sink more than once. A source **MUST NOT** greet a sink it was not connected to.

1. A source **MAY** emit data **IF AND ONLY IF** all of the following conditions hold. A source **SHALL NOT** emit even if one of the following does not hold:
    - The sink was connected to the source.
    - The source has greeted the sink with a talkback.
    - The sink has started the stream at least once.
    - The sink has not stopped the stream after the last time it has started it.
    - The source has not already ended the stream.

1. A sink **MAY** request data **IF AND ONLY IF** all of the conditions of (2) hold. The sink **SHALL NOT** request data even if one of the conditions of (2) does not hold.

1. A source **MAY** end a stream **IF AND ONLY IF** all of the conditions of (2) hold. The source **MAY** provide a reason (e.g. error). The source **SHALL NOT** end the stream even if one of the conditions of (2) does not hold.

1. A sink **MAY** stop a stream **IF AND ONLY IF** all of the conditions of (2) hold. The sink **MAY** provide a reason (e.g. error). The sink **SHALL NOT** stop the stream even if one of the conditions of (2) does not hold.

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
