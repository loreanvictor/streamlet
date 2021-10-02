import { fake, useFakeTimers } from 'sinon'

import { merge } from '../merge'
import { Subject, iterable, interval } from '../../sources'
import { tap, finalize, observe, observeLater, Observation } from '../../sinks'
import { pipe, source } from '../../util'


describe('merge()', () => {
  it('should merge two listenables.', () => {
    const cb = fake()
    const a = new Subject()
    const b = new Subject()

    pipe(
      merge(a, b),
      tap(cb),
      observe,
    )

    a.receive('hellow')
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith('hellow')

    b.receive('world')
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith('world')
  })

  it('should merge two pullables.', () => {
    const cb = fake()
    const a = iterable([1, 2, 3])
    const b = iterable(['a', 'b', 'c'])

    const o = pipe(
      merge(a, b),
      tap(cb),
      observe,
    )

    o.request()
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith('a')

    o.request()
    cb.callCount.should.equal(4)
    cb.should.have.been.calledWith(2)
    cb.should.have.been.calledWith('b')
  })

  it('should merge a listenable and a pullable.', () => {
    const cb = fake()
    const a = new Subject()
    const b = iterable([1, 2, 3])

    const o = pipe(
      merge(a, b),
      tap(cb),
      observe,
    )

    a.receive('hellow')
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith('hellow')

    o.request()
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
  })

  it('should send an error signal when one source errors.', () => {
    const cb = fake()
    const a = new Subject()
    const b = iterable([1, 2, 3])

    pipe(
      merge(a, b),
      finalize(cb),
      observe,
    )

    a.end(42)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)
  })

  it('should end when all sources end.', () => {
    const cb = fake()
    const a = new Subject()
    const b = iterable([1, 2])

    const o = pipe(
      merge(a, b),
      finalize(cb),
      observe,
    )

    a.end()
    cb.should.not.have.been.called

    o.request()
    o.request()
    cb.should.not.have.been.called

    o.request()
    cb.should.have.been.calledOnce
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const o = pipe(
      merge(interval(100), interval(50)),
      tap(cb),
      observe,
    )

    clock.tick(50)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(0)

    clock.tick(50)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(1)
    cb.should.not.have.been.calledWith(2)
    cb.resetHistory()

    o.stop()

    clock.tick(50)
    cb.should.not.have.been.called

    clock.tick(50)
    cb.should.not.have.been.called

    o.start()
    clock.tick(50)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(2)

    clock.tick(50)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(3)

    clock.restore()
  })

  it('should properly handle interruption mid initialization.', () => {
    const cb = fake()
    const srcA = source(() => o.stop())
    const srcB = source(() => cb())

    const o: Observation<any> = observeLater(merge(srcA, srcB))
    o.start()

    cb.should.not.have.been.called
  })
})
