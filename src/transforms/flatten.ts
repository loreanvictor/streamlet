import { Talkback, Source, Sink } from '../types'


class FlattenedTalkback<T> implements Talkback {
  disposed = false

  constructor(
    private sink: FlattenedSink<T>
  ) {}

  start() {
    this.disposed = false;
    (this.sink.innerTalkback || this.sink.outerTalkback)?.start()
  }

  request() {
    (this.sink.innerTalkback || this.sink.outerTalkback)?.request()
  }

  stop() {
    this.disposed = true
    this.sink.innerTalkback?.stop()
    this.sink.outerTalkback?.stop()
  }
}


class FlattenedInnerSink<T> implements Sink<T> {
  constructor(
    private sink: FlattenedSink<T>,
  ) {}

  greet(talkback: Talkback) {
    this.sink.innerTalkback = talkback
    talkback.start()
  }

  receive(t: T) {
    this.sink.sink.receive(t)
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.sink.outerTalkback?.stop()
      this.sink.sink.end(reason)
    } else {
      if (!this.sink.outerTalkback) {
        this.sink.sink.end()
      } else {
        this.sink.innerTalkback =  undefined
        if (!this.sink.talkback.disposed) {

          // FIXME: this causes an auto-pull and should be further conditioned.
          // however, currently this code will become problematic:
          //
          // ```js
          // pipe(
          //  fetch('https://pokeapi.co/api/v2/pokemon/ditto'),
          //    map(res => promise(res.json())),
          //    pullrate(1000),
          //    flatten,
          //    tap(() => console.log('GOT')),
          //    iterate,
          //  ) ```
          //
          // without this auto-pulling, this guy will just re-pull once, while
          // it should re-pull indefinitely.
          //
          // with this auto-pull, if we switch `iterate` with `observe`, still we will get
          // the same behavior, while the expected behavior might be to don't re-pull
          //
          // in any case, the latter issue can be resolved using `take(1)`, so
          // for now I'll let this auto-pull exist. but this should be fixed later on.
          //
          this.sink.outerTalkback.request()
        }
      }
    }
  }
}


export class FlattenedSink<T> implements Sink<Source<T>> {
  outerTalkback: Talkback | undefined
  innerTalkback: Talkback | undefined
  talkback: FlattenedTalkback<T>

  constructor(
    readonly sink: Sink<T>,
  ) {
    this.talkback = new FlattenedTalkback(this)
  }

  greet(talkback: Talkback) {
    this.outerTalkback = talkback
    this.sink.greet(this.talkback)
  }

  receive(innerSource: Source<T>) {
    this.innerTalkback?.stop()
    this.innerTalkback = undefined
    innerSource.connect(new FlattenedInnerSink(this))
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.innerTalkback?.stop()

      this.sink.end(reason)
    } else {
      if (!this.innerTalkback) {
        this.sink.end()
      } else {
        this.outerTalkback =  undefined
      }
    }
  }
}


export class FlattenedSource<T> implements Source<T> {
  constructor(
    private source: Source<Source<T>>
  ) { }

  connect(sink: Sink<T>) {
    this.source.connect(new FlattenedSink(sink))
  }
}


export function flatten<T>(source: Source<Source<T>>): Source<T> {
  return new FlattenedSource(source)
}
