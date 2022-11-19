import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { expr } from '../expr'
import { Subject, iterable, interval } from '../../sources'
import { pipe, source, talkback } from '../../util'
import { replay, take } from '../../transforms'
import { tap, finalize, observe } from '../../sinks'
import { Source } from '../../types'


describe('expr()', () => {
  it('should handle expressions.', () => {
    const cb = fake()
    const cb2 = fake()
    const a = new Subject<number>()
    const b = new Subject<number>()

    const o = pipe(
      expr($ => $(a) + $(b)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.not.have.been.called
    a.receive(1)
    cb.should.not.have.been.called
    b.receive(2)
    cb.should.have.been.calledWith(3)
    b.receive(41)
    cb.should.have.been.calledWith(42)

    b.receive(44)
    cb.should.have.been.calledWith(45)

    o.stop()
    cb.resetHistory()

    a.receive(5)
    cb.should.not.have.been.called

    b.receive(6)
    cb.should.not.have.been.called

    o.start()
    cb.should.not.have.been.called
    b.receive(6)
    cb.should.have.been.calledWith(7)

    cb.resetHistory()
    a.end()
    cb.should.not.have.been.called
    cb2.should.not.have.been.called

    b.receive(8)
    cb.should.have.been.calledOnceWith(9)
    cb2.should.not.have.been.called

    b.end()
    cb.should.have.been.calledOnceWith(9)
    cb2.should.have.been.calledOnce
  })

  it('should also work with pullable sources.', () => {
    const cb = fake()
    const cb2 = fake()
    const a = iterable(['a', 'b'])
    const b = iterable([1, 2, 3])

    const o = pipe(
      expr($ => $(a) + $(b)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.not.have.been.called
    o.request()
    cb.should.have.been.calledWith('a1')
    o.request()
    cb.should.have.been.calledWith('b1')
    cb.should.have.been.calledWith('b2')
    o.request()
    cb.should.have.been.calledWith('b3')
    cb.resetHistory()
    o.request()
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
  })

  it('should pass down errors when one source errs.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()
    const a = source<number>(sink => sink.greet(talkback({ start() { sink.receive(2) }, stop })))
    const b = source<number>(sink => sink.greet(talkback({ start() { sink.end(42) }})))
    pipe(
      expr($ => $(a) + $(b)),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnceWith(42)
    stop.should.have.been.calledOnce
  })

  it('should handle errors in the expr function itself.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()

    const a = source(sink => sink.greet(talkback({ start() { sink.receive(42) }, stop })))
    pipe(
      expr($ => { $(a); throw new Error('oops') }),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
    stop.should.have.been.calledOnce
  })

  it('should not re-emit for emission of passively tracked sources.', () => {
    const cb = fake()
    const cb2 = fake()
    const a = new Subject<number>()
    const b = new Subject<number>()

    const o = pipe(
      expr(($, _) => $(a) + _(b)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.not.have.been.called
    a.receive(1)
    cb.should.not.have.been.called
    b.receive(2)
    cb.should.not.have.been.called
    a.receive(1)
    cb.should.have.been.calledWith(3)
    cb.resetHistory()
    b.receive(41)
    cb.should.not.have.been.called

    b.receive(44)
    cb.should.not.have.been.called

    a.receive(-1)
    cb.should.have.been.calledOnceWith(43)

    o.stop()
    cb.resetHistory()

    a.receive(5)
    cb.should.not.have.been.called

    b.receive(6)
    cb.should.not.have.been.called

    o.start()
    cb.should.not.have.been.called
    b.receive(6)
    cb.should.not.have.been.called
    a.receive(2)
    cb.should.have.been.calledOnceWith(8)

    cb.resetHistory()
    b.end()
    cb.should.not.have.been.called
    cb2.should.not.have.been.called

    a.receive(8)
    cb.should.have.been.calledOnceWith(14)
    cb2.should.not.have.been.called

    a.end()
    cb.should.have.been.calledOnceWith(14)
    cb2.should.have.been.calledOnce
  })

  it('should properly pause / resume when some sources have ended.', () => {
    const a = take(interval(10), 3)
    const b = interval(10)

    const cb = fake()
    const clock = useFakeTimers()

    const o = pipe(
      expr($ => `${$(a)}${$(b)}`),
      tap(cb),
      observe,
    )

    cb.should.not.have.been.called
    clock.tick(20)
    cb.should.have.been.calledOnceWith('10')
    clock.tick(10)
    cb.should.have.been.calledWith('20')
    cb.should.have.been.calledWith('21')
    clock.tick(10)
    cb.should.have.been.calledWith('22')
    cb.resetHistory()
    clock.tick(10)
    cb.should.have.been.calledOnceWith('23')

    o.stop()
    cb.resetHistory()
    clock.tick(100)
    cb.should.not.have.been.called

    o.start()
    clock.tick(10)
    cb.should.have.been.calledOnceWith('24')

    clock.restore()
  })

  it('should handle sending requests to source who have not provided talkbacks.', () => {
    const a = source(() => {})
    expect(() => observe(expr($ => $(a))).request()).to.not.throw()
  })

  it('should handle mis-behaving sources.', () => {
    const a = source(sink => sink.greet(talkback({
      start() {
        sink.end()
        sink.receive(2)
      }
    })))
    const cb = fake()

    observe(tap(expr($ => $(a)), cb))
    cb.should.not.have.been.called
  })

  it('should not emit when notifying source was not tracked in last run.', () => {
    const cb = fake()

    const a = new Subject<number>()
    const b = new Subject<number>()

    pipe(
      expr($ => $(a) % 2 === 0 ? $(b) : 42),
      tap(cb),
      observe,
    )

    a.receive(2)
    b.receive(13)

    cb.should.have.been.calledOnceWith(13)

    a.receive(3)
    cb.should.have.been.calledWith(42)
    cb.resetHistory()

    b.receive(7)
    cb.should.not.have.been.called
  })

  it('should flatten higher order observables.', () => {
    const cb = fake()

    const a = new Subject<Source<number>>()
    observe(expr($ => cb($($(a)))))

    const b = new Subject<number>()
    b.receive(1)
    a.receive(b)

    cb.should.not.have.been.called

    b.receive(2)
    cb.should.have.been.calledOnceWith(2)

    b.receive(3)
    cb.should.have.been.calledWith(3)
    cb.resetHistory()

    const c = new Subject<number>()
    a.receive(c)

    cb.should.not.have.been.called

    c.receive(4)
    cb.should.have.been.calledOnceWith(4)
  })

  it('should handle observables that emit on observation precisely.', () => {
    const cb = fake()

    const a = replay(new Subject<string>())
    a.receive('X')

    observe(expr($ => cb($(a))))

    cb.should.have.been.calledOnce
  })

  it('should handle nullish start on active tracking.', () => {
    const cb = fake()

    const a = new Subject<string>()
    const b = new Subject<string>()

    a.receive('X')

    observe(expr($ => cb(($.n(a) ?? 'A') + ':' + ($.n(b) ?? 'B'))))

    cb.should.have.been.calledOnceWith('A:B')

    a.receive('a')
    cb.should.have.been.calledWith('a:B')

    b.receive('b')
    cb.should.have.been.calledWith('a:b')
  })

  it('should handle nullish start tracking with non-nullish start tracking properly.', () => {
    const cb = fake()

    const a = new Subject<string>()
    const b = new Subject<string>()

    a.receive('X')

    observe(expr($ => cb(($.n(a) ?? 'A') + ':' + ($(b) ?? 'B'))))

    cb.should.not.have.been.called

    b.receive('b')
    cb.should.have.been.calledOnceWith('A:b')

    a.receive('a')
    cb.should.have.been.calledWith('a:b')
  })

  it('should ignore nullish tracking for sources who emit on observation.', () => {
    const cb = fake()

    const a = replay(new Subject<string>())
    const b = new Subject<string>()

    a.receive('X')
    observe(expr($ => cb(($.n(a) ?? 'A') + ':' + ($.n(b) ?? 'B'))))

    cb.should.have.been.calledOnceWith('X:B')

    a.receive('a')
    cb.should.have.been.calledWith('a:B')

    b.receive('b')
    cb.should.have.been.calledWith('a:b')
  })

  it('should support nullish start for passive tracking as well.', () => {
    const cb = fake()

    const a = new Subject<string>()
    const b = new Subject<string>()

    observe(expr(($, _) => cb((_.n(a) ?? 'A') + ':' + ($(b) ?? 'B'))))

    cb.should.not.have.been.called

    b.receive('b')
    cb.should.have.been.calledOnceWith('A:b')
  })
})
