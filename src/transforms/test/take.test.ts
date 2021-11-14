import { fake, useFakeTimers } from 'sinon'

import { take } from '../take'
import { of, Subject, iterable, interval } from '../../sources'
import { tap, finalize, observe, iterate } from '../../sinks'
import { Talkback, Sink } from '../../types'
import { pipe, connect} from '../../util'


describe('take()', () => {
  it('should take a given maximum number of items from source.', () => {
    const cb = fake()
    const cb2 = fake()

    pipe(
      of(1, 2, 3, 4),
      take(2),
      tap(cb),
      finalize(cb2),
      observe,
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb2.should.have.been.calledOnce
  })

  it('should also work with pullables.', () => {
    const cb = fake()
    const cb2 = fake()

    pipe(
      iterable([1, 2, 3, 4]),
      take(2),
      tap(cb),
      finalize(cb2),
      iterate,
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(2)
    cb2.should.have.been.calledOnce
  })

  it('should pass down errors.', () => {
    const cb = fake()
    const sub = new Subject()

    pipe(
      sub,
      take(1),
      finalize(cb),
      observe
    )

    sub.end(42)
    cb.should.have.been.calledOnceWith(42)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    class Gazer implements Sink<any>, Talkback {
      talkback: Talkback

      greet(tb: Talkback) { (this.talkback = tb).start() }
      receive() {}
      end() {}
      start() { this.talkback.start() }
      request() { this.talkback.request() }
      stop() { this.talkback.stop() }
    }

    const o = pipe(
      interval(100),
      take(3),
      tap(cb),
      connect(new Gazer()),
    )

    clock.tick(100)
    cb.should.have.been.calledOnce

    o.stop()
    clock.tick(100)
    cb.should.have.been.calledOnce

    o.start()
    clock.tick(100)
    cb.should.have.been.calledTwice

    clock.tick(100)
    cb.should.have.been.calledThrice

    o.stop()
    clock.tick(100)

    o.start()
    clock.tick(100)
    cb.should.have.been.calledThrice

    clock.restore()
  })
})
