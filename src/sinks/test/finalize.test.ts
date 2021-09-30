/* eslint-disable no-unused-expressions */

import { fake } from 'sinon'

import { pipe, source, talkback, sink, connect } from '../../util'
import { finalize } from '../finalize'


describe('finalize()', () => {
  it('should call given op upon end, passing the reason.', () => {
    const op = fake()
    const end = fake()
    const receive = fake()
    const src = source(s => s.greet(talkback({
      start() {
        s.receive('A')
        s.end(42)
      }
    })))

    const snk = sink({ receive, end, greet(tb) { tb.start()} })
    pipe(src, finalize(op), connect(snk))

    receive.should.have.been.calledBefore(op)
    receive.should.have.been.calledWith('A')
    op.should.have.been.calledBefore(end)
    op.should.have.been.calledWith(42)
  })
})
