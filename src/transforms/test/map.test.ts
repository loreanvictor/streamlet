import { fake } from 'sinon'

import { map } from '../map'
import { pipe, source, talkback } from '../../util'
import { Subject } from '../../sources'
import { finalize, tap, observe } from '../../sinks'


describe('map()', () => {
  it('should convert incoming emissions according to given function.', () => {
    const cb = fake()
    const a = new Subject<number>()

    pipe(
      map(a, x => x * 2),
      tap(cb),
      observe
    )

    a.receive(42)
    cb.should.have.been.calledWith(84)
  })

  it('should pass down errors that occur within the mapping function.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()

    const src = source(sink => sink.greet(talkback({ start() { sink.receive('hellow') }, stop })))
    pipe(
      src,
      map(() => { throw new Error('oops') }),
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
      map(src, x => x * 2),
      tap(cb),
      finalize(cb2),
      observe
    )

    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce
  })
})
