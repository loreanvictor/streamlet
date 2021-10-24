import { fake, useFakeTimers } from 'sinon'
import sleep from 'sleep-promise'

import { pullAfter } from '../pull-after'
import { pipe, source, talkback } from '../../util'
import { iterable, interval } from '../../sources'
import { map } from '../../transforms'
import { tap, observe, finalize } from '../../sinks'


describe('pullAfter()', () => {
  it('should pull after given task is done.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    pipe(
      iterable([1, 2, 3]),
      pullAfter(async () => await sleep(100)),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)

    await clock.tickAsync(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(2)

    await clock.tickAsync(100)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(3)

    cb2.should.have.not.been.called
    await clock.tickAsync(100)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should pull immediately if given task is sync.', () => {
    const cb = fake()
    const cb2 = fake()

    pipe(
      iterable([1, 2, 3]),
      pullAfter(() => {}),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb.should.have.been.calledWith(3)

    cb2.should.have.been.calledOnce
  })

  it('should pass down errors.', () => {
    const cb = fake()
    const cb2 = fake()

    pipe(
      iterable([1, 2, 3]),
      map(() => { throw new Error('foo') }),
      pullAfter(() => {}),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.have.not.been.called
    cb2.should.have.been.calledOnce
  })

  it('should pass down errors from the given task.', () => {
    const cb = fake()
    const cb2 = fake()

    pipe(
      iterable([1, 2, 3]),
      pullAfter(() => { throw new Error('foo') }),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)
    cb2.should.have.been.calledOnce
  })

  it('should not pull if the source has ended in the meanwhile.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = source(sink => {
      sink.greet(talkback({
        start() {
          sink.receive(42)
          sink.end()
        },
        request: cb
      }))
    })

    pipe(
      src,
      pullAfter(() => interval(100)),
      tap(cb2),
      observe
    )

    clock.tick(100)
    cb2.should.have.been.calledOnce
    cb.should.have.been.calledOnce

    clock.restore()
  })
})
