import { fake } from 'sinon'

import { transform } from '../custom-transform'
import { Source } from '../../types'
import { Subject } from '../../sources'
import { observe, tap } from '../../sinks'
import { source, sink, pipe } from '../../util'


describe('transform()', () => {
  it('should auto-curry the given transform.', () => {
    const cb = fake()

    const mul = transform(
      (src: Source<number>, n: number) => source<number>(
        snk => src.connect(sink({
          receive: (t) => snk.receive(t * n),
        }, snk))
      )
    )

    const src = new Subject<number>()

    pipe(
      src,
      mul(2),
      tap(x => cb(x)),
      observe
    )

    src.receive(2)
    cb.should.have.been.calledWith(4)

    src.receive(3)
    cb.should.have.been.calledWith(6)
  })

  it('should also work in non-curried manner.', () => {
    const cb = fake()

    const mul3 = transform(
      (src: Source<number>) => source<number>(
        snk => src.connect(sink({
          receive: (t) => snk.receive(t * 3),
        }, snk))
      )
    )

    const src = new Subject<number>()

    pipe(
      mul3(src),
      tap(x => cb(x)),
      observe
    )

    src.receive(2)
    cb.should.have.been.calledWith(6)

    src.receive(3)
    cb.should.have.been.calledWith(9)
  })
})
