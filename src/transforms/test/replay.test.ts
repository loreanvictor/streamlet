import { fake, useFakeTimers } from 'sinon'

import { replay } from '../replay'
import { interval, Subject, iterable } from '../../sources'
import { pipe, connect } from '../../util'
import { tap, observe, iterate, finalize } from '../../sinks'


describe('replay()', () => {
  it('should replay the given source for new observers.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const cb3 = fake()
    const clock = useFakeTimers()

    const replayed = replay(interval(100))

    pipe(
      replayed,
      tap(cb1),
      observe
    )

    clock.tick(100)
    cb1.should.have.been.calledOnceWith(0)

    const o = pipe(
      replayed,
      tap(cb2),
      observe
    )

    cb2.should.have.been.calledOnceWith(0)

    clock.tick(100)

    cb1.should.have.been.calledTwice
    cb1.secondCall.should.have.been.calledWith(1)

    cb2.should.have.been.calledTwice
    cb2.secondCall.should.have.been.calledWith(0)  // --> the timer is not shared!

    clock.tick(100)

    cb1.should.have.been.calledThrice
    cb1.thirdCall.should.have.been.calledWith(2)

    cb2.should.have.been.calledThrice
    cb2.thirdCall.should.have.been.calledWith(1)

    pipe(
      replayed,
      tap(cb3),
      observe
    )

    cb3.should.have.been.calledOnceWith(1)

    o.stop()
    clock.tick(100)

    cb2.should.have.been.calledThrice
    cb3.should.have.been.calledTwice
    cb3.secondCall.should.have.been.calledWith(0)  // --> the timer is not shared!

    clock.restore()
  })

  it('should provide the last value via .last', () => {
    const clock = useFakeTimers()

    const replayed = replay(interval(100))
    observe(replayed)

    replayed.emitted.should.be.false

    clock.tick(100)
    replayed.emitted.should.be.true
    replayed.last.should.equal(0)

    clock.tick(100)
    replayed.last.should.equal(1)

    clock.restore()
  })

  it('should not feed observers any value before it has emitted.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const replayed = replay(interval(100))
    pipe(
      replayed,
      tap(cb),
      observe
    )

    cb.should.not.have.been.called

    clock.tick(100)

    cb.should.have.been.calledOnceWith(0)

    clock.restore()
  })

  it('should return a subject whenever a subject is passed to it.', () => {
    const cb = fake()
    const cb2 = fake()
    const replayed = replay(new Subject())

    pipe(
      replayed,
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.not.have.been.called

    replayed.receive(0)

    cb.should.have.been.calledOnceWith(0)

    connect(iterable([1, 2]), replayed)
    replayed.request()
    replayed.request()
    replayed.stop()

    cb.should.have.been.calledThrice
    cb.secondCall.should.have.been.calledWith(1)
    cb.thirdCall.should.have.been.calledWith(2)

    cb.resetHistory()

    const clock = useFakeTimers()
    connect(interval(100), replayed)

    clock.tick(100)
    cb.should.have.been.calledOnceWith(0)

    replayed.stop()
    clock.tick(100)
    cb.should.have.been.calledOnceWith(0)

    replayed.start()
    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.secondCall.should.have.been.calledWith(1)

    clock.restore()
    cb.resetHistory()

    pipe(
      iterable([4, 5, 6]),
      connect(replayed),
      iterate,
    )

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(4)
    cb.secondCall.should.have.been.calledWith(5)
    cb.thirdCall.should.have.been.calledWith(6)

    cb2.should.have.been.calledOnce
  })
})
