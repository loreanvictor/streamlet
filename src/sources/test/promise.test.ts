import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { promise } from '../promise'
import { pipe } from '../../util'
import { share } from '../../transforms'
import { tap, finalize, observe, observeLater } from '../../sinks'


describe('promise()', () => {
  it('should emit the value of given promise.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    pipe(promise(Promise.resolve(42)), tap(cb), finalize(cb2), observe)

    cb.should.not.have.been.called
    cb2.should.not.have.been.called

    await clock.nextAsync()

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should send down errors.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    pipe(promise(Promise.reject(42)), tap(cb), finalize(cb2), observe)

    await clock.nextAsync()

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
    cb2.should.have.been.calledWith(42)

    clock.restore()
  })

  it('should be pausable / resumable.', async () => {
    const cb = fake()
    const ob = observe(tap(promise(Promise.resolve(42)), cb))
    const clock = useFakeTimers()

    ob.stop()
    await clock.nextAsync()

    cb.should.not.have.been.called

    ob.start()
    await clock.nextAsync()

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)

    clock.restore()
  })

  it('should handle redundant restarts.', async () => {
    const clock = useFakeTimers()

    const ob = observe(promise(Promise.resolve()))
    await clock.nextAsync()

    expect(() => {
      ob.started = false
      ob.start()
    }).to.not.throw()

    clock.restore()
  })

  it('should not send down errors when already stopped.', async () => {
    const cb = fake()
    const clock = useFakeTimers()
    const ob = pipe(promise(Promise.reject(42)), finalize(cb), observe)

    ob.stop()
    await clock.nextAsync()

    cb.should.not.have.been.called

    clock.restore()
  })

  it('should immediately end the sink when its internal promise has already resolved.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = share(promise(Promise.resolve(42)))
    observe(src)

    await clock.nextAsync()

    const ob = pipe(src, tap(cb), finalize(cb2), observeLater)
    ob.start()
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce

    clock.restore()
  })
})
