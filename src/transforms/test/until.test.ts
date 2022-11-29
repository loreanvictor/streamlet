import { fake, useFakeTimers } from 'sinon'

import { until } from '../until'
import { pipe, source, talkback } from '../../util'
import { Subject, interval, iterable } from '../../sources'
import { take, pullrate } from '../../transforms'
import { observe, iterate, tap, finalize } from '../../sinks'
import { TrackFunc } from '../../types'


describe('until()', () => {
  it('should end the source when the gate source ends.', () => {
    const cb = fake()
    const cb2 = fake()

    const src = new Subject<number>()
    const gate = new Subject()

    pipe(
      src,
      until(gate),
      tap(x => cb(x)),
      finalize(cb2),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnceWith(1)

    gate.receive('HOLA')
    gate.receive(42)
    cb.should.have.been.calledOnceWith(1)

    src.receive(2)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(2)

    gate.end()
    cb2.should.have.been.calledOnce

    src.receive(3)
    cb.should.have.been.calledTwice
  })

  it('should start the gate if it provides the talkback later than the main source.', () => {
    const cb = fake()
    const cb2 = fake()
    const cb3 = fake()
    const clock = useFakeTimers()

    const gate = source(sink => {
      setTimeout(() => sink.greet(talkback({
        start: cb
      })), 100)

      setTimeout(() => sink.end(), 200)
    })

    const src = new Subject()

    pipe(
      src,
      until(gate),
      tap(cb2),
      finalize(cb3),
      observe,
    )

    src.receive(1)
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnceWith(1)

    clock.tick(100)
    cb.should.have.been.calledOnce


    clock.tick(100)
    cb3.should.have.been.calledOnce

    src.receive(2)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should pause the gate when the main observation is paused.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = new Subject()

    const o = pipe(
      src,
      until(take(interval(200), 1)),
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnceWith(1)

    clock.tick(100)

    src.receive(2)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(2)

    o.stop()

    clock.tick(800)

    o.start()

    cb2.should.not.have.been.called

    src.receive(3)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(3)

    clock.tick(100)
    cb2.should.have.been.calledOnce

    src.receive(4)
    cb.should.have.been.calledThrice

    clock.restore()
  })

  it('should work with iterable gates as well.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = new Subject()
    const gate = pipe(
      iterable([1, 2, 3]),
      pullrate(100),
    )

    pipe(
      src,
      until(gate),
      tap(cb),
      finalize(cb2),
      observe,
    )

    clock.tick(100)

    src.receive(1)
    cb.should.have.been.calledOnceWith(1)

    clock.tick(300)
    cb2.should.have.been.calledOnce

    src.receive(2)
    cb.should.have.been.calledOnce

    clock.restore()
  })

  it('should open and close the sink when the gate ends synchronously.', () => {
    const cb = fake()
    const cb2 = fake()

    const src = new Subject()

    pipe(
      src,
      until(iterable([1, 2, 3])),
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.receive(1)
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
  })

  it('should end when the source ends.', () => {
    const cb = fake()
    const cb2 = fake()
    const gate = source(sink => sink.greet(talkback({})))

    const src = new Subject()

    pipe(
      src,
      until(gate),
      tap(cb),
      finalize(() => cb2(42)),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnceWith(1)

    src.end()
    cb2.should.have.been.calledOnceWith(42)
  })

  it('should also work with pullable sources.', () => {
    const cb = fake()
    const cb2 = fake()
    const gate = source(sink => sink.greet(talkback({})))

    pipe(
      iterable([1, 2, 3]),
      until(gate),
      tap(cb),
      finalize(() => cb2(42)),
      iterate,
    )

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb.should.have.been.calledWith(3)
    cb2.should.have.been.calledOnceWith(42)
  })

  it('should support expressions.', () => {
    const cb = fake()
    const cb2 = fake()

    const src = new Subject<number>()
    const gate = new Subject()

    pipe(
      ($: TrackFunc) => $(src) * 2,
      until($ => $(gate)),
      tap(x => cb(x)),
      finalize(cb2),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnceWith(2)

    gate.receive('HOLA')
    gate.receive(42)
    cb.should.have.been.calledOnceWith(2)

    src.receive(2)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(4)

    gate.end()
    cb2.should.have.been.calledOnce

    src.receive(3)
    cb.should.have.been.calledTwice
  })
})
