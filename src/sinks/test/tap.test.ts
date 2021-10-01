import { fake, useFakeTimers } from 'sinon'
import { of, interval } from '../../sources'
import { source, sink, connect, pipe } from '../../util'
import { tap } from '../tap'
import { observe } from '../observe'


describe('tap()', () => {
  it('should run given op on incoming data.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const ob = observe(tap(interval(100), cb))

    cb.should.not.have.been.called

    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(0)

    clock.tick(200)
    cb.should.have.been.calledThrice
    cb.lastCall.should.have.been.calledWith(2)

    ob.stop()
  })

  it('should invoke given op before passing down the data.', () => {
    const cb1 = fake()
    const cb2 = fake()
    const receive = fake()

    pipe(of('A'), tap(cb1), tap(cb2), connect(sink({
      receive,
      greet(tb) { tb.start() }
    })))

    cb1.should.have.been.calledBefore(cb2)
    cb2.should.have.been.calledBefore(receive)
  })

  it('should pass down errors.', () => {
    const end = fake()
    const snk = sink({ end })
    const src = source(s => s.end(42))

    pipe(src, tap(fake()), connect(snk))

    end.should.have.been.calledWith(42)
  })
})
