import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { Subject } from '../subject'
import { pipe, connect, sink } from '../../util'
import { interval, iterable } from '../../sources'
import { greet, tap, finalize, observe } from '../../sinks'


describe('Subject', () => {
  it('should act as a controllable source.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const sub = new Subject()

    pipe(sub, tap(cb1), finalize(cb2), observe)

    cb1.should.not.have.been.called
    cb2.should.not.have.been.called

    sub.receive(2)
    cb1.should.have.been.calledOnce
    cb1.should.have.been.calledWith(2)
    cb2.should.not.have.been.called

    sub.receive(3)
    cb1.should.have.been.calledTwice
    cb1.should.have.been.calledWith(3)
    cb2.should.not.have.been.called

    sub.end()
    cb2.should.have.been.calledOnce
  })

  it('should be able to handle multiple observers.', () => {
    const cb1 = fake()
    const cb2 = fake()

    const sub = new Subject()
    const o1 = pipe(sub, tap(cb1), observe)

    sub.receive(1)
    cb1.should.have.been.calledOnce
    cb1.should.have.been.calledWith(1)
    cb2.should.not.have.been.called

    const o2 = pipe(sub, tap(cb2), observe)
    cb2.should.not.have.been.called

    sub.receive(2)
    cb1.should.have.been.calledTwice
    cb1.should.have.been.calledWith(2)
    cb2.should.have.been.calledOnce
    cb2.should.have.been.calledWith(2)

    o1.stop()
    cb1.resetHistory()

    sub.receive(3)

    cb1.should.not.have.been.called
    cb2.should.have.been.calledTwice
    cb2.should.have.been.calledWith(3)

    o2.stop()
    cb2.resetHistory()

    sub.receive(4)
    cb1.should.not.have.been.called
    cb2.should.not.have.been.called

    o1.start()
    sub.receive(5)
    cb1.should.have.been.calledOnce
    cb1.should.have.been.calledWith(5)
    cb2.should.not.have.been.called
  })

  it('should also act as a sink.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const sub = new Subject()
    connect(interval(100), sub)
    pipe(sub, tap(cb), observe)

    clock.tick(200)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(0)
    cb.should.have.been.calledWith(1)
    cb.resetHistory()

    sub.stop()
    clock.tick(200)
    cb.should.not.have.been.called

    clock.restore()
  })

  it('should also act as a proper sink for iterables.', () => {
    const cb = fake()

    const sub = new Subject()
    connect(iterable(['A', 'B', 'C']), sub)

    const o = pipe(sub, tap(cb), observe)
    cb.should.not.have.been.called

    sub.request()
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith('A')

    o.request()
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith('B')
  })

  it('should be resilient to sinks stopping while data is being propagated.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const sub = new Subject()
    pipe(sub, tap(() => o2.stop()), observe)
    const o2 = pipe(sub, tap(cb1), observe)
    pipe(sub, tap(cb2), observe)

    sub.receive('Halo')
    cb1.should.not.have.been.called
    cb2.should.have.been.calledOnce
  })

  it('should be resilient to sinks stopping while end signal is being propagated.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const sub = new Subject()
    pipe(sub, finalize(() => o2.stop()), observe)
    const o2 = pipe(sub, finalize(cb1), observe)
    pipe(sub, finalize(cb2), observe)

    sub.end()
    cb1.should.not.have.been.called
    cb2.should.have.been.calledOnce
  })

  it('should handle situations where a non-connected sink is being disconnected.', () => {
    const sub = new Subject()
    const sub2 = new Subject()
    expect(() => sub.disconnect(sub2)).to.not.throw()
  })

  it('should not connect to new sinks after it is done.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const sub = new Subject()

    pipe(sub, greet(cb1), observe)
    sub.end()
    pipe(sub, greet(cb2), observe)

    cb1.should.have.been.calledOnce
    cb2.should.not.have.been.called
  })

  it('should not start new sinks after it is done.', () => {
    const clock = useFakeTimers()

    const sub = new Subject()
    const snk = sink({
      greet: (tb) => setTimeout(() => tb.start(), 100)
    })

    connect(sub, snk)
    clock.tick(50)
    sub.end()
    clock.tick(50)

    sub.sinks.length.should.equal(0)

    clock.restore()
  })
})
