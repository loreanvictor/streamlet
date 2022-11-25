import { fake } from 'sinon'

import { Subject } from '../../sources'
import { TrackFunc } from '../../types'
import { pipe, source, talkback, sink, connect } from '../../util'
import { finalize } from '../finalize'
import { observe } from '../observe'


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

  it('should support expressions.', () => {
    const op = fake()
    const cb = fake()

    const a = new Subject<number>()

    pipe(
      ($: TrackFunc) => cb($(a) * 2),
      finalize(op),
      observe,
    )

    cb.should.not.have.been.called
    op.should.not.have.been.called

    a.receive(1)
    a.receive(2)

    cb.should.have.been.calledTwice
    op.should.not.have.been.called

    a.end()

    op.should.have.been.calledOnce
  })
})
