import { fake } from 'sinon'

import { filter } from '../filter'
import { pipe, source, talkback } from '../../util'
import { Subject } from '../../sources'
import { finalize, tap, observe } from '../../sinks'
import { TrackFunc } from '../../types'


describe('filter()', () => {
  it('should filter incoming emissions according to given function.', () => {
    const cb = fake()
    const a = new Subject<number>()

    pipe(
      filter(a, x => x % 2 === 0),
      tap(cb),
      observe
    )

    a.receive(1)
    cb.should.not.have.been.called
    a.receive(2)
    cb.should.have.been.calledWith(2)
  })

  it('should pass down errors that occur within the mapping function.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()

    const src = source(sink => sink.greet(talkback({ start() { sink.receive('hellow') }, stop })))
    pipe(
      src,
      filter(() => { throw new Error('oops') }),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
    stop.should.have.been.calledOnce
  })

  it('should pass down errors from the source.', () => {
    const cb = fake()
    const cb2 = fake()
    const src = source<number>(sink => sink.greet(talkback({ start() { sink.end(42) } })))

    pipe(
      filter(src, x => x > 42),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
  })

  it('should support expressions.', () => {
    const cb = fake()
    const a = new Subject<number>()

    pipe(
      ($: TrackFunc) => $(a) + 1,
      filter(x => x % 2 === 0),
      tap(cb),
      observe
    )

    a.receive(2)
    cb.should.not.have.been.called

    a.receive(3)
    cb.should.have.been.calledWith(4)
  })
})
