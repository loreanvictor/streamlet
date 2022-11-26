import { fake, useFakeTimers } from 'sinon'

import { prepend, append, concat } from '../concat'
import { take } from '../../transforms'
import { Subject, iterable, of, interval } from '../../sources'
import { observe, tap, iterate, finalize } from '../../sinks'
import { pipe } from '../../util'


describe('prepend()', () => {
  it('should prepend given values to given stream.', () => {
    const cb = fake()
    const sub = new Subject<number>()

    pipe(
      sub,
      prepend([of(1, 2), of(3)]),
      tap(cb),
      observe
    )

    cb.should.have.been.calledThrice
    cb.getCall(0).should.have.been.calledWith(1)
    cb.getCall(1).should.have.been.calledWith(2)
    cb.getCall(2).should.have.been.calledWith(3)

    sub.receive(4)
    cb.callCount.should.equal(4)
    cb.getCall(3).should.have.been.calledWith(4)
  })

  it('should also work with iterables.', () => {
    const cb = fake()

    pipe(
      prepend(iterable([4, 5]), iterable([2, 3])),
      tap(cb),
      iterate
    )

    cb.callCount.should.equal(4)
    cb.getCall(0).should.have.been.calledWith(2)
    cb.getCall(1).should.have.been.calledWith(3)
    cb.getCall(2).should.have.been.calledWith(4)
    cb.getCall(3).should.have.been.calledWith(5)
  })

  it('should end the stream early if one of the streams errors.', () => {
    const cb = fake()
    const cb2 = fake()

    const err = new Subject()

    pipe(
      of(3, 4),
      prepend([of(1, 2), err]),
      tap(cb),
      finalize(cb2),
      observe
    )

    err.end(42)

    cb.should.have.been.calledTwice
    cb.getCall(0).should.have.been.calledWith(1)
    cb.getCall(1).should.have.been.calledWith(2)

    cb2.should.have.been.calledOnceWith(42)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const ob = pipe(
      of(42),
      prepend(take(interval(100), 2)),
      tap(cb),
      observe
    )

    clock.tick(100)
    cb.should.have.been.calledOnceWith(0)

    ob.stop()
    clock.tick(100)
    ob.start()
    clock.tick(100)

    cb.should.have.been.calledThrice
    cb.getCall(1).should.have.been.calledWith(1)
    cb.getCall(2).should.have.been.calledWith(42)

    clock.restore()
  })

  it('should support expressions.', () => {
    const cb = fake()

    const a = new Subject<number>()

    pipe(
      of(1, 2),
      prepend($ => $(a) * 2),
      tap(cb),
      observe
    )

    cb.should.not.have.been.called
    a.receive(4)
    cb.should.have.been.calledOnceWith(8)
    a.end()
    cb.should.have.been.calledThrice
    cb.getCall(1).should.have.been.calledWith(1)
    cb.getCall(2).should.have.been.calledWith(2)
  })
})


describe('append()', () => {
  it('should append given values to given stream.', () => {
    const cb = fake()
    const sub = new Subject<number>()

    pipe(
      sub,
      append([of(1, 2), of(3)]),
      tap(cb),
      observe
    )

    cb.should.not.have.been.called

    sub.receive(4)
    sub.end()

    cb.callCount.should.equal(4)
    cb.getCall(0).should.have.been.calledWith(4)
    cb.getCall(1).should.have.been.calledWith(1)
    cb.getCall(2).should.have.been.calledWith(2)
    cb.getCall(3).should.have.been.calledWith(3)
  })

  it('should also work with iterables.', () => {
    const cb = fake()

    pipe(
      append(iterable([4, 5]), iterable([2, 3])),
      tap(cb),
      iterate
    )

    cb.callCount.should.equal(4)
    cb.getCall(0).should.have.been.calledWith(4)
    cb.getCall(1).should.have.been.calledWith(5)
    cb.getCall(2).should.have.been.calledWith(2)
    cb.getCall(3).should.have.been.calledWith(3)
  })

  it('should end the stream early if one of the streams errors.', () => {
    const cb = fake()
    const cb2 = fake()

    const err = new Subject()

    pipe(
      of(3, 4),
      append([err, of(1, 2)]),
      tap(cb),
      finalize(cb2),
      observe
    )

    err.end(42)

    cb.should.have.been.calledTwice
    cb.getCall(0).should.have.been.calledWith(3)
    cb.getCall(1).should.have.been.calledWith(4)

    cb2.should.have.been.calledOnceWith(42)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const ob = pipe(
      of(42),
      append(take(interval(100), 2)),
      tap(cb),
      observe
    )

    cb.should.have.been.calledOnceWith(42)

    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.getCall(1).should.have.been.calledWith(0)

    ob.stop()
    clock.tick(100)
    ob.start()
    clock.tick(100)

    cb.should.have.been.calledThrice
    cb.getCall(2).should.have.been.calledWith(1)

    clock.restore()
  })

  it('should support expressions.', () => {
    const cb = fake()

    const a = new Subject<number>()

    pipe(
      of(1, 2),
      append($ => $(a) * 2),
      tap(cb),
      observe
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)

    a.receive(4)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(8)
  })
})


describe('concat()', () => {
  it('should concat given sources.', () => {
    const cb = fake()
    const sub = new Subject<number>()

    pipe(
      concat(sub, of(1, 2), of(3)),
      tap(cb),
      observe
    )

    cb.should.not.have.been.called

    sub.receive(4)
    sub.end()

    cb.callCount.should.equal(4)
    cb.getCall(0).should.have.been.calledWith(4)
    cb.getCall(1).should.have.been.calledWith(1)
    cb.getCall(2).should.have.been.calledWith(2)
    cb.getCall(3).should.have.been.calledWith(3)
  })

  it('should also work with iterables.', () => {
    const cb = fake()

    pipe(
      concat(iterable([4, 5]), iterable([2, 3])),
      tap(cb),
      iterate
    )

    cb.callCount.should.equal(4)
    cb.getCall(0).should.have.been.calledWith(4)
    cb.getCall(1).should.have.been.calledWith(5)
    cb.getCall(2).should.have.been.calledWith(2)
    cb.getCall(3).should.have.been.calledWith(3)
  })

  it('should end the stream early if one of the streams errors.', () => {
    const cb = fake()
    const cb2 = fake()

    const err = new Subject()

    pipe(
      concat(of(3, 4), err, of(1, 2)),
      tap(cb),
      finalize(cb2),
      observe
    )

    err.end(42)

    cb.should.have.been.calledTwice
    cb.getCall(0).should.have.been.calledWith(3)
    cb.getCall(1).should.have.been.calledWith(4)

    cb2.should.have.been.calledOnceWith(42)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const ob = pipe(
      concat(of(42), take(interval(100), 2)),
      tap(cb),
      observe
    )

    cb.should.have.been.calledOnceWith(42)

    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.getCall(1).should.have.been.calledWith(0)

    ob.stop()
    clock.tick(100)
    ob.start()
    clock.tick(100)

    cb.should.have.been.calledThrice
    cb.getCall(2).should.have.been.calledWith(1)

    clock.restore()
  })

  it('should support expressions.', () => {
    const cb = fake()
    const a = of(1, 2, 3)
    const b = of(4, 5, 6)

    pipe(
      concat($ => $(a) * 10, $ => $(b) - 1),
      tap(cb),
      observe
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(30)
    cb.should.have.been.calledWith(5)
  })
})
