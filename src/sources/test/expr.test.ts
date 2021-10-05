import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { expr } from '../expr'
import { Subject, iterable, interval } from '../../sources'
import { pipe, source, talkback } from '../../util'
import { take } from '../../transforms'
import { tap, finalize, observe } from '../../sinks'


describe('expr()', () => {
  it('should handle expressions.', () => {
    const cb = fake()
    const cb2 = fake()
    const a = new Subject<number>()
    const b = new Subject<number>()

    const o = pipe(
      expr($ => $(a, 0) + $(b, 2)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.have.been.calledOnceWith(2)
    a.receive(1)
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
      expr($ => $(a, 'Z') + $(b, 0)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.have.been.calledOnceWith('Z0')
    o.request()
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith('a0')
    cb.should.have.been.calledWith('a1')
    o.request()
    cb.callCount.should.equal(5)
    cb.should.have.been.calledWith('b1')
    cb.should.have.been.calledWith('b2')
    o.request()
    cb.callCount.should.equal(6)
    cb.should.have.been.calledWith('b3')
    o.request()
    cb.callCount.should.equal(6)
    cb2.should.have.been.calledOnce
  })

  it('should pass down errors when one source errs.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()
    const a = source<number>(sink => sink.greet(talkback({ stop })))
    const b = source<number>(sink => sink.greet(talkback({ start() { sink.end(42) }})))
    pipe(
      expr($ => $(a, 0) + $(b, 0)),
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

    const a = source(sink => sink.greet(talkback({ stop })))
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
      expr(($, _) => $(a, 0) + _(b, 2)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.have.been.calledOnceWith(2)
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
    const a = take(interval(10), 2)
    const b = interval(20)

    const cb = fake()
    const clock = useFakeTimers()

    const o = pipe(
      expr($ => `${$(a, -1) + 1}${$(b, -1) + 1}`),
      tap(cb),
      observe,
    )

    cb.should.have.been.calledOnceWith('00')
    clock.tick(10)
    cb.should.have.been.calledWith('10')
    clock.tick(10)
    cb.should.have.been.calledWith('21')
    cb.resetHistory()
    clock.tick(10)
    cb.should.not.have.been.called
    clock.tick(10)
    cb.should.have.been.calledOnceWith('22')

    o.stop()
    cb.resetHistory()
    clock.tick(100)
    cb.should.not.have.been.called

    o.start()
    clock.tick(20)
    cb.should.have.been.calledOnceWith('23')

    clock.restore()
  })

  it('should handle sending requests to source who have not provided talkbacks.', () => {
    const a = source(() => {})
    expect(() => observe(expr($ => $(a, 0))).request()).to.not.throw()
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
})
