import { fake } from 'sinon'

import { scan } from '../scan'
import { Subject } from '../../sources'
import { pipe } from '../../util'
import { tap, finalize, observe } from '../../sinks'
import { TrackFunc } from '../../types'


describe('scan()', () => {
  it('should accumulate incoming values based on given accumulator.', () => {
    const cb = fake()
    const src = new Subject<number>()

    pipe(
      src,
      scan((acc, x) => acc + x),
      tap(cb),
      observe,
    )

    src.receive(2)
    cb.should.have.been.calledOnceWith(2)

    src.receive(3)
    cb.should.have.been.calledWith(5)
  })

  it('should also use given initial value as starter.', () => {
    const cb = fake()
    const src = new Subject()

    pipe(
      scan(src, c => c + 1, 0),
      tap(cb),
      observe,
    )

    src.receive('A')
    cb.should.have.been.calledOnceWith(1)

    src.receive(42)
    cb.should.have.been.calledWith(2)
  })

  it('should pass down errors happening in the accumulator.', () => {
    const cb = fake()
    const cb2 = fake()
    const src = new Subject()

    pipe(
      src,
      scan(() => { throw new Error('foo') }),
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.receive('AA')
    cb.should.have.been.calledOnceWith('AA')
    cb2.should.not.have.been.called

    src.receive('BB')
    cb.should.have.been.calledOnce
    cb2.should.have.been.calledOnce
  })

  it('should pass down errors from source.', () => {
    const cb = fake()
    const cb2 = fake()
    const src = new Subject()

    pipe(
      src,
      scan(a => a),
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.end(42)
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnceWith(42)
  })

  it('should support expressions.', () => {
    const cb = fake()
    const src = new Subject<number>()

    pipe(
      ($: TrackFunc) => $(src) * 2,
      scan((acc, x) => acc + x),
      tap(cb),
      observe,
    )

    src.receive(2)
    cb.should.have.been.calledOnceWith(4)

    src.receive(3)
    cb.should.have.been.calledWith(10)
  })
})
