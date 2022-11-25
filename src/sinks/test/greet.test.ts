import { fake } from 'sinon'

import { pipe, sink, connect } from '../../util'
import { of, Subject } from '../../sources'
import { greet } from '../greet'
import { TrackFunc } from '../../types'
import { observe } from '../observe'


describe('greet()', () => {
  it('should call given op upon greet.', () => {
    const g1 = fake()
    const g2 = fake()

    pipe(
      of(1, 2, 3),
      greet(g1),
      connect(sink({ greet(tb) {
        g2()
        tb.start()
      } }))
    )

    g1.should.have.been.calledBefore(g2)
    g2.should.have.been.calledOnce
  })

  it('should support expressions.', () => {
    const cb1 = fake()
    const cb2 = fake()

    const a = new Subject<number>()

    pipe(
      ($: TrackFunc) => cb2($(a) * 2),
      greet(cb1),
      observe,
    )

    cb1.should.have.been.calledOnce
    cb2.should.not.have.been.called

    a.receive(1)
    a.receive(2)

    cb2.should.have.been.calledTwice
    cb1.should.have.been.calledOnce
  })
})
