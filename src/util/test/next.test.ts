import { fake, useFakeTimers } from 'sinon'
import sleep from 'sleep-promise'

import { next } from '../next'
import { of, interval } from '../../sources'
import { take, map, buffer } from '../../transforms'
import { pipe, source, talkback } from '../../util'


describe('next()', () => {
  it('should turn a sync source to an async iterable.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of next(of(1, 2, 3))) {
        cb(x)
      }
    }

    f()
    await clock.tickAsync(0)

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb.should.have.been.calledWith(3)

    clock.restore()
  })

  it('should turn an async source to an async iterable.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of next(take(interval(100), 3))) {
        cb(x)
      }
    }

    f()
    await clock.tickAsync(300)

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(0)
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)

    clock.restore()
  })

  it('should close off the sync if async iteration is broken off.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = source(sink => sink.greet(talkback({
      start: () => sink.receive(42),
      stop: cb
    })))

    const f = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of next(src)) {
        break
      }
    }

    f()
    await clock.tickAsync(0)

    cb.should.have.been.calledOnce
    clock.restore()
  })

  it('should be lossy.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of next(take(interval(100), 3))) {
        cb(x)
        await sleep(100)
      }
    }

    f()
    await clock.tickAsync(600)

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(0)
    cb.should.have.been.calledWith(2)
    clock.restore()
  })

  it('should not be lossy with a pull buffer.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of pipe(interval(100), buffer, take(4), next)) {
        cb(x)
        await sleep(100)
      }
    }

    f()
    await clock.tickAsync(600)

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(0)
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    clock.restore()
  })

  it('should not be lossy with sync sources.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of pipe(of(1, 2, 3), next)) {
        cb(x)
        await sleep(100)
      }
    }

    f()
    await clock.tickAsync(600)

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb.should.have.been.calledWith(3)
    clock.restore()
  })

  it('should pass down errors from sync sources.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of pipe(of(1, 2, 3), map(y => {
        if (y === 2) {
          throw new Error('oops')
        }

        return y
      }
      ), next)) {
        cb(x)
      }
    }

    f().catch(cb2)
    await clock.tickAsync(600)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should pass down errors from async sources.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const f = async () => {
      for await (const x of pipe(
        interval(100),
        take(3),
        map(y => {
          if (y === 1) {
            throw new Error('oops')
          }

          return y
        }),
        next
      )) {
        cb(x)
      }
    }

    f().catch(cb2)
    await clock.tickAsync(600)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(0)
    cb2.should.have.been.calledOnce

    clock.restore()
  })
})
