import { fake, useFakeTimers } from 'sinon'

import { stream } from '../stream'
import { iterable, of } from '../../sources'
import { pullrate } from '../../transforms'
import { tap, observe, iterate } from '../../sinks'
import { pipe, source, talkback } from '../../util'


describe('stream()', () => {
  it('should make an iterable source listenable.', () => {
    const cb = fake()

    pipe(
      iterable([1, 2, 3]),
      stream,
      tap(cb),
      observe
    )

    cb.should.be.calledThrice
    cb.firstCall.should.have.been.calledWith(1)
    cb.secondCall.should.have.been.calledWith(2)
    cb.thirdCall.should.have.been.calledWith(3)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const o = pipe(
      iterable([1, 2, 3]),
      pullrate(100),
      stream,
      tap(cb),
      observe,
    )

    clock.tick(100)
    cb.should.have.been.calledOnceWith(1)

    o.stop()
    clock.tick(100)
    cb.should.have.been.calledOnceWith(1)

    o.start()
    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.secondCall.should.have.been.calledWith(2)

    clock.restore()
  })

  it('should still be iterable.', () => {
    const cb = fake()

    pipe(
      iterable([1, 2, 3]),
      stream,
      tap(cb),
      iterate
    )

    cb.should.be.calledThrice
    cb.firstCall.should.have.been.calledWith(1)
    cb.secondCall.should.have.been.calledWith(2)
    cb.thirdCall.should.have.been.calledWith(3)
  })

  it('should handle sync sources well enough.', () => {
    const cb = fake()

    pipe(
      of(1, 2, 3),
      stream,
      tap(cb),
      observe
    )

    cb.should.be.calledThrice
    cb.firstCall.should.have.been.calledWith(1)
    cb.secondCall.should.have.been.calledWith(2)
    cb.thirdCall.should.have.been.calledWith(3)
  })

  it('should not request after it receives an end signal.', () => {
    const cb = fake()
    const src = source(snk => {
      let got = false
      let ended = false
      snk.greet(talkback({
        start() { snk.receive(1) },
        request() {
          if (!got) {
            got = true
            snk.receive(2)
          } else if (!ended) {
            ended = true
            snk.end()
          } else {
            cb()
          }
        }
      }))
    })

    pipe(
      src,
      stream,
      iterate
    )

    cb.should.not.have.been.called
  })
})
