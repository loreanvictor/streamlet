import { fake } from 'sinon'

import { memo } from '../memo'
import { Subject } from '../subject'
import { pipe } from '../../util'
import { tap, observe } from '../../sinks'
import { SKIP } from '../expr'


describe('memo()', () => {
  it('should only recalculate when sources have distinct values.', () => {
    const cb = fake()

    const a = new Subject<number>()
    const b = new Subject<number>()

    observe(memo($ => cb($(a) + $(b))))

    a.receive(1)
    b.receive(2)

    cb.should.have.been.calledOnce

    a.receive(1)
    a.receive(2)

    cb.should.have.been.calledTwice

    b.receive(2)
    b.receive(3)

    cb.should.have.been.calledThrice
  })

  it('should only emit values when the result has changed.', () => {
    const cb = fake()

    const a = new Subject<number>()
    const b = new Subject<number>()

    pipe(
      memo($ => $(a) % $(b)),
      tap(cb),
      observe,
    )

    a.receive(10)
    b.receive(2)
    b.receive(5)

    cb.should.have.been.calledOnceWith(0)

    a.receive(7)
    a.receive(12)

    cb.should.have.been.calledTwice
    cb.secondCall.should.have.been.calledWith(2)
  })

  it('should also consider skips.', () => {
    const cb = fake()

    const a = new Subject<number>()
    const e = memo($ => {
      if ($(a) % 2 === 0) {
        return SKIP
      } else {
        return $(a)
      }
    })

    pipe(
      e,
      tap(cb),
      observe,
    )

    a.receive(1)
    cb.should.have.been.calledOnceWith(1)

    a.receive(2)
    cb.should.have.been.calledOnce

    a.receive(1)
    cb.should.have.been.calledOnce

    a.receive(3)
    cb.should.have.been.calledWith(3)
  })
})
