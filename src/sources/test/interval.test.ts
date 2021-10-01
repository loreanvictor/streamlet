import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { observe, tap } from '../../sinks'
import { pipe } from '../../util'
import { interval } from '../interval'


describe('interval()', () => {
  it('should emit at given time intervals.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const obs = pipe(
      interval(100),
      tap(cb),
      observe
    )

    cb.should.not.have.been.called

    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.lastCall.should.have.been.calledWith(0)

    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.lastCall.should.have.been.calledWith(1)

    clock.tick(100)
    cb.should.have.been.calledThrice
    cb.lastCall.should.have.been.calledWith(2)

    obs.stop()
  })

  it('should be pausable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const obs = pipe(
      interval(100),
      tap(cb),
      observe
    )

    clock.tick(200)
    cb.should.have.been.calledTwice
    cb.lastCall.should.have.been.calledWith(1)
    cb.resetHistory()
    obs.stop()

    clock.tick(1000)
    cb.should.not.have.been.called

    obs.start()
    clock.tick(1000)
    cb.callCount.should.equal(10)
    cb.firstCall.should.have.been.calledWith(2)
    cb.lastCall.should.have.been.calledWith(11)

    obs.stop()
  })

  it('should deal with redundant start/stops.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    expect(() => {
      const obs = observe(tap(interval(100), cb))
      obs.started = false
      obs.start()
      clock.tick(100)
      cb.lastCall.should.have.been.calledWith(0)

      obs.started = false
      obs.start()
      cb.should.have.been.calledOnce
      cb.lastCall.should.have.been.calledWith(0)

      clock.tick(100)
      cb.should.have.been.calledTwice
      cb.lastCall.should.have.been.calledWith(1)
      obs.started = false
      obs.start()
      cb.should.have.been.calledTwice
      cb.lastCall.should.have.been.calledWith(1)

      obs.stop()
      clock.tick(100)
      obs.started = true
      obs.stop()
      obs.start()
      obs.start()
      clock.tick(100)
      cb.should.have.been.calledThrice
      cb.lastCall.should.have.been.calledWith(2)
      obs.stop()
      obs.started = true
      obs.stop()

    }).to.not.throw()
  })
})
