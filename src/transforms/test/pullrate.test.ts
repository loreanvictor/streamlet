import { fake, useFakeTimers } from 'sinon'

import { pullrate } from '../pullrate'
import { iterable } from '../../sources'
import { map } from '../../transforms'
import { tap, finalize, iterate } from '../../sinks'
import { pipe, source, talkback } from '../../util'


describe('pullrate()', () => {
  it('should allow pulls only at given rate.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    pipe(
      iterable([1, 2, 3, 4, 5]),
      pullrate(100),
      tap(cb),
      iterate,
    )

    cb.should.not.have.been.called
    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)
    clock.tick(50)
    cb.should.have.been.calledOnce
    clock.tick(50)
    cb.should.have.been.calledTwice

    clock.restore()
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const i = pipe(
      iterable([1, 2, 3, 4, 5]),
      pullrate(100),
      tap(cb),
      iterate,
    )

    cb.should.not.have.been.called
    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)

    i.stop()
    clock.tick(100)
    cb.should.have.been.calledOnce

    i.start()
    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(2)

    clock.restore()
  })

  it('should pass down errors.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    pipe(
      iterable([1, 2, 3, 4, 5]),
      map(() => { throw new Error('foo') }),
      pullrate(100),
      finalize(cb),
      iterate
    )

    await clock.nextAsync()
    cb.should.have.been.calledOnce

    clock.restore()
  })

  it('should not make requests after end signal was received.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = source(sink => {
      let requested = false
      sink.greet(talkback({
        request() {
          if (requested) {
            cb()
          } else {
            requested = true
            sink.receive(42)
            sink.end()
          }
        }
      }))
    })

    iterate(pullrate(src, 100))

    clock.tick(500)
    cb.should.not.have.been.called

    clock.restore()
  })
})
