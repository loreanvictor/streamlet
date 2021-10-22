import { fake } from 'sinon'

import { buffer } from '../buffer'
import { Subject } from '../../sources'
import { tap, observe, finalize } from '../../sinks'
import { pipe } from '../../util'


describe('pullBuffer()', () => {
  it('should buffer incoming emissions and wait for them to be pulled.', () => {
    const cb = fake()
    const cb2 = fake()
    const src = new Subject()

    const o = pipe(
      src,
      buffer(3),
      tap(cb),
      finalize(cb2),
      observe
    )

    src.receive(1)
    src.receive(2)

    cb.should.not.have.been.called
    o.request()
    cb.should.have.been.calledOnceWith(1)
    cb.resetHistory()

    src.receive(3)
    src.receive(4)
    src.receive(5)

    o.request()
    cb.should.have.been.calledOnceWith(3)

    o.request()
    o.request()
    o.request()
    cb.resetHistory()

    src.receive(6)
    src.receive(7)
    cb.should.have.been.calledOnceWith(6)

    src.end()
    cb2.should.not.have.been.called

    o.request()
    cb2.should.have.been.calledOnce
  })

  it('should pass down errors.', () => {
    const cb = fake()
    const src = new Subject()

    pipe(
      src,
      buffer,
      finalize(cb),
      observe
    )

    src.end(42)
    cb.should.have.been.calledOnceWith(42)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const src = new Subject()

    const o = pipe(
      src,
      buffer(3),
      tap(cb),
      observe
    )

    src.receive(1)

    o.stop()
    src.receive(2)

    o.start()
    src.receive(3)

    o.request()
    o.request()

    cb.should.have.been.calledTwice
    cb.firstCall.should.have.been.calledWith(1)
    cb.secondCall.should.have.been.calledWith(3)
  })
})
