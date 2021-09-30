/* eslint-disable no-unused-expressions */

import { fake } from 'sinon'

import { pipe, sink, connect } from '../../util'
import { of } from '../../sources'
import { greet } from '../greet'


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
})
