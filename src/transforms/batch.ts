import { Source, Sink, Talkback, isSource } from '../types'
import { Multiplexer } from '../util'


export type BatchSelector<I, O> = (last: I, batched?: O) => O
const SELECT_LAST = <T>(t: T, _?: unknown) => t


class ReleaseMultiplexer<I, O> extends Multiplexer<I, void, BatchedSink<I, O>> {
  constructor(sinks: BatchedSink<I, O>[]) { super(sinks, false) }
  act(sink: BatchedSink<I, O>) { sink.release() }
}


export class BatchedSink<I, O=I> implements Sink<I>, Talkback {
  talkback: Talkback
  last?: O
  task: Promise<void> | undefined = undefined

  constructor(
    readonly source: BatchedSource<I, O>,
    readonly sink: Sink<O>,
  ) { }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(this)
  }

  receive(value: I) {
    this.last = this.source.select(value, this.last)

    if (!this.task) {
      this.task = Promise.resolve().then(() => {
        this.release()
      })
    }
  }

  release() {
    if (this.task) {
      this.task = undefined
      this.sink.receive(this.last!)
    }
  }

  end(reason?: unknown) {
    this.task = undefined
    this.source.unplug(this)
    this.sink.end(reason)
  }

  start() {
    this.source.plug(this)
    this.talkback.start()
  }

  request() {
    this.talkback.request()
  }

  stop(reason?: unknown) {
    this.task = undefined
    this.source.unplug(this)
    this.talkback.stop(reason)
  }
}


export class BatchedSource<I, O = I> implements Source<O> {
  sinks: BatchedSink<I, O>[] = []
  releaseMux = new ReleaseMultiplexer<I, O>(this.sinks)

  constructor(
    readonly source: Source<I>,
    readonly select: BatchSelector<I, O> = SELECT_LAST as any,
  ) {}

  connect(sink: Sink<O>) {
    this.source.connect(new BatchedSink(this, sink))
  }

  plug(sink: BatchedSink<I, O>) {
    this.sinks.push(sink)
  }

  unplug(sink: BatchedSink<I, O>) {
    const index = this.sinks.indexOf(sink)
    this.sinks.splice(index, 1)
  }

  release() {
    this.releaseMux.send()
  }
}


export function batch(): <I>(source: Source<I>) => BatchedSource<I, I>
export function batch<I>(source: Source<I>): BatchedSource<I>
export function batch<I, O>(select: BatchSelector<I, O>): (src: Source<I>) => BatchedSource<I, O>
export function batch<I, O>(source: Source<I>, select?: BatchSelector<I, O>): BatchedSource<I, O>
export function batch<I, O = I>(
  source?: Source<I> | BatchSelector<I, O>,
  select?: BatchSelector<I, O>
): BatchedSource<I, O> | ((src: Source<I>) => BatchedSource<I, O>) {
  if (isSource(source)) {
    return new BatchedSource(source, select)
  } else {
    return (src: Source<I>) => batch(src, source)
  }
}
