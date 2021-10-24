import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { combine } from '../combine'
import { Subject, iterable, interval } from '../../sources'
import { pipe, source } from '../../util'
import { map } from '../../transforms'
import { tap, finalize, iterate, observe, observeLater, Observation } from '../../sinks'


describe('combine()', () => {
  it('should combine two listenable sources.', () => {
    const cb = fake()
    const cb2 = fake()
    const a = new Subject()
    const b = new Subject()

    pipe(
      combine(a, b),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.not.have.been.called

    a.receive(1)
    cb.should.not.have.been.called

    a.receive(2)
    cb.should.not.have.been.called

    b.receive(1)
    cb.should.have.been.calledOnceWithExactly([2, 1])

    b.receive(3)
    a.receive(4)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWithExactly([4, 3])

    a.end()
    cb2.should.not.have.been.called
    b.end()
    cb2.should.have.been.called
  })

  it('should combine two pullable sources.', () => {
    const cb = fake()
    const cb2 = fake()
    const o = pipe(
      combine(
        iterable([1, 2]),
        iterable(['A', 'B']),
      ),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.not.have.been.called
    o.request()
    cb.should.have.been.calledOnceWithExactly([1, 'A'])
    o.request()
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWithExactly([2, 'B'])

    cb2.should.not.have.been.called
    o.request()
    cb2.should.have.been.calledOnce
  })

  it('should combine a pullable and a listenable source.', () => {
    const cb = fake()
    const cb2 = fake()
    const sub = new Subject()
    const o = pipe(
      combine(iterable([1, 2]), sub),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.not.have.been.called
    sub.receive('A')
    cb.should.not.have.been.called
    o.request()
    cb.should.have.been.calledOnceWithExactly([1, 'A'])
    o.request()
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWithExactly([2, 'A'])
    o.request()
    cb.should.have.been.calledTwice
    sub.receive('B')
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWithExactly([2, 'B'])

    cb2.should.not.have.been.called
    sub.end()
    cb2.should.have.been.calledOnce
  })

  it('should end the stream when one source errors.', () => {
    const cb = fake()
    const cb2 = fake()

    const a = new Subject()
    const b = new Subject()

    pipe(
      combine(map(a, () => { throw new Error() }), b),
      tap(cb),
      finalize(cb2),
      observe,
    )

    a.receive(1)
    cb.should.not.have.been.called
    cb2.should.not.have.been.calledOnce
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const o = pipe(
      combine(interval(50), interval(100)),
      tap(cb),
      observe,
    )

    clock.tick(100)
    cb.should.have.been.calledOnceWithExactly([1, 0])

    o.stop()
    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.resetHistory()

    o.start()
    clock.tick(50)
    cb.should.have.been.calledOnceWithExactly([2, 0])

    clock.restore()
  })

  it('should emit an empty array when given no sources.', () => {
    const cb = fake()
    const cb2 = fake()
    pipe(
      combine(),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.have.been.calledOnceWithExactly([])
    cb2.should.have.been.calledOnce
  })

  it('should properly handle interruption mid initialization.', () => {
    const cb = fake()
    const srcA = source(() => o.stop())
    const srcB = source(() => cb())

    const o: Observation<any> = observeLater(combine(srcA, srcB))
    o.start()

    cb.should.not.have.been.called
  })

  it('should handle request calles without having been initialized.', () => {
    expect(() => {
      pipe(
        combine(source(() => {})),
        observe,
      ).request()
    }).not.to.throw()
  })

  it('should emit distinct array objects.', () => {
    const cb = fake()

    pipe(
      combine(
        iterable([1, 2]),
        iterable(['a', 'b'])
      ),
      tap(cb),
      iterate
    )

    cb.firstCall.firstArg.should.not.equal(cb.secondCall.firstArg)
  })
})
