import { fake } from 'sinon'


import { expr } from '../expr'
import { Subject } from '../../sources'
import { pipe } from '../../util'
import { tap, observe } from '../../sinks'


describe('expr()', () => {
  it('should handle expressions.', () => {
    const cb = fake()
    const a = new Subject<number>()
    const b = new Subject<number>()

    const o = pipe(
      expr($ => $(a, 0) + $(b, 2)),
      tap(cb),
      observe,
    )

    cb.should.have.been.calledOnceWith(2)
    a.receive(1)
    cb.should.have.been.calledWith(3)
    b.receive(41)
    cb.should.have.been.calledWith(42)

    b.receive(44)
    cb.should.have.been.calledWith(45)

    o.stop()
    cb.resetHistory()

    a.receive(5)
    cb.should.not.have.been.called

    b.receive(6)
    cb.should.not.have.been.called

    o.start()
    cb.should.not.have.been.called
    b.receive(6)
    cb.should.have.been.calledWith(7)
  })
})
