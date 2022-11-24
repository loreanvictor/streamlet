import { Source, Sink, Talkback } from '../types'
import { Multiplexer } from '../util'


export const SKIP = Symbol('SKIP')


export type TrackFunc = {
  <T>(source: Sourceable<T>): T
  n<T>(source: Sourceable<T>): T | undefined
  on(...sources: Source<unknown>[]): void
}
export type ExprFunc<R = unknown> = ($: TrackFunc, _: TrackFunc) => R | typeof SKIP | Promise<R | typeof SKIP>
export type Sourceable<T> = Source<T> | ExprFunc<T>


export function from<T>(_sourceable: Sourceable<T>): Source<T> {
  if (typeof _sourceable === 'function') {
    (_sourceable as any).__expr__ ??= expr(_sourceable)

    return (_sourceable as any).__expr__
  }

  return _sourceable
}


class TrackingNotEmitted extends Error {}

class MaskMultiplexer extends Multiplexer<unknown, void, ExprTracking<unknown>> {
  constructor(trackings: ExprTracking<unknown>[]) { super(trackings, true) }
  act(tracking: ExprTracking<unknown>) { tracking.seen = false }
}


class StartMultiplexer extends Multiplexer<unknown, void, ExprTracking<unknown>> {
  constructor(trackings: ExprTracking<unknown>[]) { super(trackings, true) }
  act(tracking: ExprTracking<unknown>) {
    if (tracking.talkback && !tracking.disposed) {
      tracking.talkback.start()
    }
  }
}


class StopMultiplexer extends Multiplexer<unknown, ExprTracking<unknown> | void, ExprTracking<unknown>> {
  constructor(trackings: ExprTracking<unknown>[]) { super(trackings, true) }
  act(tracking: ExprTracking<unknown>, exempt?: ExprTracking<unknown>) {
    if (tracking !== exempt && tracking.talkback && !tracking.disposed) {
      tracking.talkback.stop()
    }
  }
}


class RequestMultiplexer extends Multiplexer<unknown, void, ExprTracking<unknown>> {
  constructor(trackings: ExprTracking<unknown>[]) { super(trackings, true) }
  act(tracking: ExprTracking<unknown>) { tracking.talkback?.request() }
}


export class ExprTracking<T> implements Sink<T> {
  talkback: Talkback | undefined
  value: T
  seen = true
  disposed = false
  emitted = false

  constructor(
    readonly active: boolean,
    private exprTalkback: ExprTalkback<unknown>
  ) {}

  greet(talkback: Talkback) {
    this.talkback = talkback
    this.talkback.start()
  }

  receive(value: T) {
    if (!this.disposed) {
      this.emitted = true
      this.value = value
      if (this.active) {
        this.exprTalkback.run(this)
      }
    }
  }

  end(reason?: unknown) {
    if (reason !== undefined) {
      this.exprTalkback.error(reason, this)
    } else {
      this.disposed = true
      this.exprTalkback.endCheck()
    }
  }
}


export class ExprTalkback<R> implements Talkback {
  initial = true
  midInitialRun = false
  defaultActive = true
  syncToken: undefined | Symbol

  trackings: ExprTracking<unknown>[] = []
  trackmap = new WeakMap<Source<unknown>, ExprTracking<unknown>>()
  activeTrack: TrackFunc
  passiveTrack: TrackFunc

  maskMux = new MaskMultiplexer(this.trackings)
  startMux = new StartMultiplexer(this.trackings)
  stopMux = new StopMultiplexer(this.trackings)
  reqMux = new RequestMultiplexer(this.trackings)

  endCount = 0
  disposed = false

  constructor(
    readonly source: ExprSource<R>,
    readonly sink: Sink<R>,
  ) {
    this.activeTrack = (src => this.track(src, this.defaultActive)) as TrackFunc
    this.passiveTrack = (src => this.track(src, false)) as TrackFunc

    this.activeTrack.n = src => this.track(src, this.defaultActive, true)
    this.passiveTrack.n = src => this.track(src, false, true)

    this.activeTrack.on = this.passiveTrack.on = (...sources) => {
      this.defaultActive = false
      sources.forEach(src => this.track(src, true))
    }
  }

  start() {
    if (this.initial) {
      this.initial = false
      this.run()
    } else {
      this.startMux.send()
    }
  }

  async run(tracking?: ExprTracking<unknown>) {
    if (!tracking) {
      this.midInitialRun = true
    } else if (this.midInitialRun) {
      return
    }

    this.maskMux.send()

    try {
      const res = this.source._expr(this.activeTrack, this.passiveTrack)

      const syncToken = Symbol()
      this.syncToken = syncToken

      const value = res instanceof Promise ? await res : res

      if (this.syncToken !== syncToken) {
        return
      }

      if (!this.disposed && (!tracking || tracking.seen)) {
        this.delegate(value)
      }
    } catch (error) {
      if (!this.disposed && !(error instanceof TrackingNotEmitted)) {
        this.error(error)
      }
    }

    this.midInitialRun = false
  }

  error(reason: unknown, source?: ExprTracking<unknown>) {
    this.disposed = true
    this.sink.end(reason)
    this.stopMux.send(source)
    this.trackings.length = 0
  }

  endCheck() {
    if (++this.endCount === this.trackings.length) {
      this.disposed = true
      this.sink.end()
      this.trackings.length = 0
    }
  }

  request() {
    this.reqMux.send()
  }

  stop() {
    this.stopMux.send()
  }

  protected delegate(value: R | typeof SKIP) {
    if (value !== SKIP) {
      this.sink.receive(value)
    }
  }

  protected startTracking<T>(source: Source<T>, active: boolean): ExprTracking<T> {
    return new ExprTracking(active, this)
  }

  protected connect<T>(source: Source<T>, active: boolean): ExprTracking<T> {
    let tracking = this.trackmap.get(source) as ExprTracking<T>
    if (!tracking) {
      tracking = this.startTracking(source, active)
      this.trackings.push(tracking)
      this.trackmap.set(source, tracking)
      source.connect(tracking)
    }

    return tracking
  }

  protected track<T>(source: Sourceable<T>, active: boolean): T
  protected track<T>(source: Sourceable<T>, active: boolean, nullish: true): T | undefined
  protected track<T>(source: Sourceable<T>, active: boolean, nullish = false) {
    const tracking = this.connect(from(source), active)
    tracking.seen = true

    if (!tracking.emitted) {
      if (nullish) {
        return undefined
      } else {
        throw new TrackingNotEmitted()
      }
    }

    return tracking.value
  }
}


export class ExprSource<R> implements Source<R> {
  constructor(readonly _expr: ExprFunc<R>) {}

  connect(sink: Sink<R>) {
    sink.greet(new ExprTalkback(this, sink))
  }
}


export function expr<R>(e: ExprFunc<R>): Source<R> {
  return new ExprSource(e)
}
