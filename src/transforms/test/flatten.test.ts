import { fake } from 'sinon'
import { expect } from 'chai'

import { flatten } from '../flatten'
import { Subject, iterable, of } from '../../sources'
import { pipe, source, talkback } from '../../util'
import { tap, observe, iterate, finalize } from '../../sinks'


describe('flatten()', () => {
  it('should flatten a stream', () => {
    const cb = fake()
    pipe(of(of(42)), flatten, tap(cb), observe)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)
  })

  it('should also work with iterables.', () => {
    const cb = fake()
    pipe(
      iterable([
        iterable([1, 2]),
        iterable([3]),
      ]),
      flatten,
      tap(cb),
      iterate
    )

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb.should.have.been.calledWith(3)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const cb2 = fake()
    const outer = new Subject()

    const o = pipe(
      flatten(outer),
      tap(cb),
      finalize(cb2),
      observe
    )

    outer.receive(of(1))
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)

    const a = new Subject()
    outer.receive(a)
    cb.should.have.been.calledOnce

    a.receive(2)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(2)

    o.stop()
    a.receive(3)
    cb.should.have.been.calledTwice

    o.start()
    a.receive(4)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(4)

    o.stop()
    const x = new Subject()
    outer.receive(x)

    a.receive(5)
    x.receive('A')
    cb.should.have.been.calledThrice

    o.start()
    x.receive('B')
    cb.should.have.been.calledThrice

    a.receive(6)
    cb.callCount.should.equal(4)
    cb.should.have.been.calledWith(6)

    const b = new Subject()
    outer.receive(b)
    b.receive(7)
    cb.callCount.should.equal(5)
    cb.should.have.been.calledWith(7)
  })

  it('should properly handle end signals.', () => {
    const cb = fake()
    const outer = new Subject()
    const inner = new Subject()

    pipe(
      outer,
      flatten,
      finalize(cb),
      observe
    )

    outer.receive(of(1))
    outer.receive(inner)
    inner.receive(2)

    inner.end()
    cb.should.not.have.been.called

    outer.end()
    cb.should.have.been.calledOnce
  })

  it('should properly handle end signals when inner has not finished.', () => {
    const cb = fake()
    const outer = new Subject()
    const inner = new Subject()

    pipe(
      outer,
      flatten,
      finalize(cb),
      observe
    )

    outer.receive(of(1))
    outer.receive(inner)
    inner.receive(2)
    outer.end(42)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)
  })

  it('should stop outer source when inner source errors.', () => {
    const stop = fake()
    const cb = fake()
    const src = source(sink => sink.greet(talkback({
      start: () => sink.receive(source(snk => snk.greet(talkback({
        start: () => snk.end(42)
      })))),
      stop,
    })))

    pipe(
      src,
      flatten,
      finalize(cb),
      observe,
    )

    stop.should.have.been.calledOnce
    cb.should.have.been.calledOnceWith(42)
  })

  it('should properly handle stops when no inner source is active.', () => {
    expect(() => {
      pipe(new Subject(), flatten, observe).stop()
    }).to.not.throw()
  })

  it('should not end until the last inner source has ended.', () => {
    const cb = fake()
    const cb2 = fake()

    const a = new Subject()
    const b = new Subject()
    const c = new Subject()

    pipe(
      of(a, b, c),
      flatten,
      tap(cb),
      finalize(cb2),
      iterate
    )

    a.receive(1)
    b.receive(2)
    c.receive(3)
    cb.should.have.been.calledOnceWith(3)
    cb2.should.not.have.been.called

    a.end()
    b.end()
    cb2.should.not.have.been.called

    c.end()
    cb2.should.have.been.calledOnce
  })

  it('should end properly when the outer source ends while there is no inner source.', () => {
    const cb = fake()
    const cb2 = fake()

    const outer = new Subject()
    const a = new Subject()
    const b = new Subject()

    pipe(
      outer,
      flatten,
      tap(cb),
      finalize(cb2),
      observe
    )

    outer.receive(a)
    outer.receive(b)
    a.receive(1)
    b.receive(2)
    cb.should.have.been.calledOnceWith(2)

    b.end()
    cb2.should.not.have.been.called

    outer.end(42)
    cb2.should.have.been.calledOnceWith(42)
  })

  it('should support expressions.', () => {
    const cb = fake()

    pipe(
      () => () => 2,
      flatten,
      tap(cb),
      observe,
    )

    cb.should.have.been.calledOnceWith(2)
  })
})
