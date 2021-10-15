import { fake, useFakeTimers } from 'sinon'

import { retry } from '../retry'
import { Subject, iterable, interval } from '../../sources'
import { map, share } from '../../transforms'
import { observe, tap, finalize, iterate } from '../../sinks'
import { pipe } from '../../util'


describe('retry()', () => {
  it('should retry connecting to the source whenever an error occurs.', () => {
    const cb = fake()
    const cb2 = fake()

    const src = new Subject<number>()
    pipe(
      src,
      map(x => {
        if (x === 1) {
          throw new Error('error')
        }

        return x
      }),
      retry(2),
      tap(cb),
      finalize(cb2),
      observe,
    )

    src.receive(2)
    cb.should.have.been.calledOnceWith(2)

    src.receive(1)
    cb.should.have.been.calledOnce

    src.receive(3)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(3)

    src.receive(1)
    cb.should.have.been.calledTwice
    cb2.should.not.have.been.called

    src.receive(4)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(4)

    src.receive(1)
    cb.should.have.been.calledThrice
    cb2.should.have.been.calledOnce
  })

  it('should also work with pullables.', () => {
    const cb = fake()

    pipe(
      iterable([1, 2, 3]),
      share,
      map(x => {
        if (x === 2) {
          throw new Error('error')
        }

        return x
      }),
      retry,
      tap(cb),
      iterate,
    )

    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)
    cb.should.have.been.calledWith(3)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const o = pipe(
      interval(100),
      share,
      map(x => {
        if (x % 2 === 1) {
          throw new Error('error')
        }

        return x
      }),
      retry(3),
      tap(cb),
      observe,
    )

    clock.tick(100)
    cb.should.have.been.calledOnceWith(0)

    clock.tick(100)
    cb.should.have.been.calledOnce

    o.stop()
    clock.tick(200)
    o.start()

    cb.should.have.been.calledOnce

    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(2)

    clock.restore()
  })
})
