import { fake } from 'sinon'

import { source } from '../custom-source'
import { tap, observe } from '../../sinks'
import { pipe } from '../../util'


describe('source()', () => {
  it('should create a source based on given func.', () => {
    const cb = fake()
    const src = source(cb)
    observe(src)

    cb.should.have.been.calledOnce
  })

  it('should return the same source object if it is passed to it.', () => {
    const src = source(fake())
    source(src).should.equal(src)
  })

  it('should emit plain values.', () => {
    const cb = fake()

    pipe(
      source(42),
      tap(cb),
      observe
    )

    cb.should.have.been.calledOnceWithExactly(42)
  })
})
