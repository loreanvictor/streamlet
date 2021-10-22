import { fake, useFakeTimers } from 'sinon'

import { first, last, nth } from '../nth'
import { pipe, source, talkback } from '../../util'
import { of, interval } from '../../sources'
import { map, take } from '../../transforms'


describe('first()', () => {
  it('should await the first value of given source.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    first(of(1, 2, 3)).then(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnceWithExactly(1)
    clock.restore()
  })

  it('should pass down errors.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    first(map(of(1, 2, 3), () => { throw new Error() })).catch(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    clock.restore()
  })

  it('should throw proper error for empty sources.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const never = source(sink => {
      sink.greet(talkback({
        start() { sink.end() }
      }))
    })

    first(never).catch(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    cb.firstCall.args[0].message.should.equal('Expected at least 1 emissions, but got 0')
    clock.restore()
  })
})


describe('last()', () => {
  it('should await the last value of given source.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    last(take(interval(100), 3)).then(cb)
    await clock.tickAsync(300)

    cb.should.have.been.calledOnceWithExactly(2)
    clock.restore()
  })

  it('should pass down errors.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    last(map(of(1, 2, 3), () => { throw new Error() })).catch(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    clock.restore()
  })

  it('should throw proper error for empty sources.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const never = source(sink => {
      sink.greet(talkback({
        start() { sink.end() }
      }))
    })

    last(never).catch(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    cb.firstCall.args[0].message.should.equal('Expected at least 1 emissions, but got 0')
    clock.restore()
  })
})


describe('nth()', () => {
  it('should await the nth value of given source.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    nth(of(1, 2, 3), 2).then(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnceWithExactly(2)
    clock.restore()
  })

  it('should pass down errors.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    nth(map(of(1, 2, 3), () => { throw new Error() }), 2).catch(cb)
    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    clock.restore()
  })

  it('should throw proper error when enough emissions are not given.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    pipe(
      of(1, 2, 3),
      nth(4)
    ).catch(cb)

    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    cb.firstCall.args[0].message.should.equal('Expected at least 4 emissions, but got 3')
    clock.restore()
  })
})
