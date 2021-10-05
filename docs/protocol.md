<div align="center">

<img src="./misc/logo-cutout.svg" width="128px"/>
  
# Streamlet Protocol

</div>

<br><br>

Streamlet protocol is a protocol for handling data/event streams. It lays down interfaces for some [primitive constructs](#primitive-constructs)
necessary for handling streams, and some [rules](#rules) of how such primitives should interact with each other. This allows exceeding extensibility as
tools and libraries implementing these interfaces and following the rules of the protocol can seamlessly work together.

The protocol is designed for handling all models of reactive programming: push, pull, push-pull, or any combination of them. It allows you to handle
iterables (lists, arrays, generators, etc) the same way as you would listenables (events, timers, network streams, etc).

The protocol also allows and standardizes data streams that can be stopped and restarted (paused and resumed) at will. The protocol DOES NOT require
or guarantee that any data stream following the protocol will have that capability though, as it is up to implementations to support that. However
the protocol does in effect encourage supporting this capability and makes it rather easy to implement.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document
are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

<br><br>

# Primitive Constructs

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

<br><br>

# Rules

1. A source **MUST** greet a sink with a talkback after they are connected. A source **MAY** greet a connected sink synchronously or asynchronously.
2. A source **MAY** send data or an end signal to a sink, **IF AND ONLY IF** all of the following hold:
    - The sink was connected to the source.
    - The source has greeted the sink with a talkback.
    - The sink has started the talkback at least once.
    - The sink has not stopped the talkback after the last time it has started it.
    - The source has not already sent an end signal to the sink.
3. A source **MAY** provide additional reasons for the end signal (i.e. error). Similarly, a sink **MAY** provide additional reasons for why it is stopping the stream.
4. A sink **MAY** request for more data using its talkback, **IF AND ONLY IF** all of the conditions of (2) hold.

The actions and steps discribed in these rules correspond to and are defined as method calls on sources, sinks and talkbacks:

- Connecting a source and a sink happens by calling `.connect()` method of the source.
- Greeting a sink with a talkback happens by calling `.greet()` method of the sink.
- Starting a talkback (or the stream) happens by calling `.start()` method of the talkback.
- Stopping the talkback (or the stream) happens by calling `.stop()` method of the talkback.
- Ending the stream (or sending an end signal) happens by calling `.end()` method of the sink.
- Requesting more data from the stream happens by calling `.request()` method of the talkback.

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
