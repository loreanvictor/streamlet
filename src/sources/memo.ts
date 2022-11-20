import { Source, Sink } from '../types'
import { ExprFunc, ExprTracking, ExprTalkback, SKIP } from './expr'


export class MemoTracking<T> extends ExprTracking<T> {
  receive(value: T) {
    const initial = !this.emitted

    if (!this.active || initial || value !== this.value) {
      super.receive(value)
    }
  }
}


export class MemoTalkback<R> extends ExprTalkback<R> {
  last: R
  emitted = false

  protected delegate(value: R | typeof SKIP) {
    if (value !== SKIP && (!this.emitted || value !== this.last)) {
      this.emitted = true
      this.last = value
      super.delegate(value)
    }
  }

  protected startTracking<T>(source: Source<T>, active: boolean): MemoTracking<T> {
    return new MemoTracking<T>(active, this)
  }
}


export class MemoSource<R> implements Source<R> {
  constructor(readonly _expr: ExprFunc<R>) {}

  connect(sink: Sink<R>) {
    sink.greet(new MemoTalkback(this, sink))
  }
}


export function memo<R>(e: ExprFunc<R>): Source<R> {
  return new MemoSource(e)
}
