import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { share } from '../share'
import { interval, iterable } from '../../sources'
import { tap, finalize, observe } from '../../sinks'
import { pipe, sink } from '../../util'


describe('share()', () => {
  it('should share the source.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const clock = useFakeTimers()
    const src = share(pipe(interval(100), tap(cb1)))

    observe(pipe(src, tap(cb2)))
    observe(pipe(src, tap(cb2)))

    clock.tick(100)

    cb1.should.have.been.calledOnce
    cb2.should.have.been.calledTwice

    clock.restore()
  })

  it('should be pausable / resumable.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = share(interval(100))

    const o1 = observe(pipe(src, tap(cb1)))
    const o2 = observe(pipe(src, tap(cb2)))

    clock.tick(100)
    cb1.should.have.been.calledOnce
    cb2.should.have.been.calledOnce
    cb2.should.have.been.calledWith(0)

    o2.stop()
    clock.tick(100)

    cb1.should.have.been.calledTwice
    cb2.should.have.been.calledOnce

    o2.start()
    clock.tick(100)

    cb1.should.have.been.calledThrice
    cb2.should.have.been.calledTwice
    cb2.should.have.been.calledWith(2)

    o1.stop()
    o2.stop()
    clock.tick(100)

    o1.start()
    clock.tick(100)
    cb1.callCount.should.equal(4)
    cb1.lastCall.should.have.been.calledWith(3)

    clock.restore()
  })

  it('should also share pullable sources.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const cb3 = fake()

    const src = share(iterable([0, 1]))

    const o1 = observe(pipe(src, tap(cb1), finalize(cb3)))
    const o2 = observe(pipe(src, tap(cb2)))

    o1.request()
    cb2.should.have.been.calledOnce
    cb2.should.have.been.calledWith(0)

    o2.request()
    cb1.should.have.been.calledTwice
    cb1.should.have.been.calledWith(1)

    o1.request()
    cb3.should.have.been.calledOnce
  })

  it('should handle disconnection from bogus sinks.', () => {
    expect(() => share(interval(100)).disconnect(sink({}))).to.not.throw()
  })
})
