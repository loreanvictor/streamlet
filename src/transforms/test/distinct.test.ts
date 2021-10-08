import { fake } from 'sinon'

import { distinct } from '../distinct'
import { Subject } from '../../sources'
import { pipe } from '../../util'
import { tap, finalize, observe } from '../../sinks'


describe('distinct()', () => {
  it('should only allow distinct values from the source.', () => {
    const cb = fake()
    const cb2 = fake()
    const src = new Subject<number>()
    pipe(
      src,
      distinct,
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnceWith(1)
    src.receive(1)
    cb.should.have.been.calledOnceWith(1)

    src.end()
    cb2.should.have.been.calledOnce
  })

  it('should also use custom given equality check function.', () => {
    const cb = fake()
    const cb2 = fake()
    const src = new Subject()
    pipe(
      distinct(src, (a: any, b: any) => a.id === b.id),
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.receive({ id: 1 })
    cb.should.have.been.calledOnceWithExactly({ id: 1 })
    src.receive({ id: 1 })
    cb.should.have.been.calledOnceWithExactly({ id: 1 })
    src.receive({ id: 2 })
    cb.should.have.been.calledTwice

    src.end(42)
    cb2.should.have.been.calledOnceWithExactly(42)
  })
})
