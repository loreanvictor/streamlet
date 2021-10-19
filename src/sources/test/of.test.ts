import { fake } from 'sinon'

import { of } from '../of'
import { take } from '../../transforms'
import { pipe, sink, connect } from '../../util'
import { observe, finalize, tap } from '../../sinks'


describe('of()', () => {
  it('should emit given values synchronously.', () => {
    const cb = fake()
    const cb2 = fake()
    pipe(
      of(1, 2, 3),
      take(2),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb2.should.have.been.calledOnce
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const cb2 = fake()

    let talkback: any
    let count = 0
    const snk = sink({
      greet: tb => (talkback = tb).start(),
      receive: () => (++count === 2 ? talkback.stop() : null)
    })

    pipe(
      of(1, 2, 3),
      tap(cb),
      finalize(cb2),
      connect(snk)
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb2.should.not.have.been.called

    talkback.start()
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(3)
    cb2.should.have.been.calledOnce
  })
})
