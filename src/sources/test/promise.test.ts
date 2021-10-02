import { fake } from 'sinon'
import { expect } from 'chai'
import sleep from 'sleep-promise'

import { promise } from '../promise'
import { pipe } from '../../util'
import { tap, finalize, observe } from '../../sinks'


describe('promise()', () => {
  it('should emit the value of given promise.', async () => {
    const cb = fake()
    const cb2 = fake()

    pipe(promise(Promise.resolve(42)), tap(cb), finalize(cb2), observe)

    cb.should.not.have.been.called
    cb2.should.not.have.been.called

    await sleep(1)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)
    cb2.should.have.been.calledOnce
  })

  it('should send down errors.', async () => {
    const cb = fake()
    const cb2 = fake()

    pipe(promise(Promise.reject(42)), tap(cb), finalize(cb2), observe)

    await sleep(1)

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
    cb2.should.have.been.calledWith(42)
  })

  it('should be pausable / resumable.', async () => {
    const cb = fake()
    const ob = observe(tap(promise(Promise.resolve(42)), cb))

    ob.stop()
    await sleep(1)

    cb.should.not.have.been.called

    ob.start()
    await sleep(1)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(42)
  })

  it('should handle redundant restarts.', async () => {
    const ob = observe(promise(Promise.resolve()))
    await sleep(1)

    expect(() => {
      ob.started = false
      ob.start()
    }).to.not.throw()
  })

  it('should not send down errors when already stopped.', async () => {
    const cb = fake()
    const ob = pipe(promise(Promise.reject(42)), finalize(cb), observe)

    ob.stop()
    await sleep(1)

    cb.should.not.have.been.called
  })
})
