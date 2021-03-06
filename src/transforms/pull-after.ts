import { Source, Sink, Talkback, SourceFactory, USourceFactory } from '../types'
import { wait, WaitNotifier } from '../util'


type NoArgTask = () => void | WaitNotifier
type Task<T> = (t: T) => void | WaitNotifier


export class PullingAfterSink<T> implements Sink<T> {
  talkback: Talkback
  disposed = false
  pull: () => void

  constructor(
    private readonly sink: Sink<T>,
    private readonly task: Task<T> | NoArgTask,
  ) {
    this.pull = () => {
      if (!this.disposed) {
        this.talkback.request()
      }
    }
  }

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.sink.greet(talkback)

    this.talkback.request()
  }

  receive(value: T) {
    this.sink.receive(value)
    try {
      const waiting = this.task(value as any)
      if (waiting) {
        wait(this.pull, waiting)
      } else {
        this.talkback.request()
      }
    } catch (err) {
      this.sink.end(err)
      this.talkback.stop(err)
    }
  }

  end(reason?: unknown) {
    this.disposed = true
    this.sink.end(reason)
  }
}


export class PullingAfterSource<T> implements Source<T> {
  constructor(
    private readonly source: Source<T>,
    private readonly task: Task<T> | NoArgTask,
  ) {}

  connect(sink: Sink<T>) {
    this.source.connect(new PullingAfterSink(sink, this.task))
  }
}


export function pullAfter(task: NoArgTask): USourceFactory
export function pullAfter<T>(task: Task<T>): SourceFactory<T>
export function pullAfter<T>(source: Source<T>, task: Task<T> | NoArgTask): Source<T>
export function pullAfter<T>(source: Source<T> | Task<T> | NoArgTask, task?: Task<T> | NoArgTask)
: Source<T> | SourceFactory<T> | USourceFactory {
  if (task !== undefined) {
    return new PullingAfterSource<T>(source as Source<T>, task)
  } else {
    return (src: Source<T>) => pullAfter<T>(src, source as Task<T>)
  }
}
