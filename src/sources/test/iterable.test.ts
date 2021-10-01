import { fake, useFakeTimers } from 'sinon'

import { iterate, tap } from '../../sinks'
import { sink, connect, pipe } from '../../util'
import { iterable } from '../iterable'


describe('iterable()', () => {
  it('should make a pullable source from given iterable.', () => {
    const cb = fake()
    pipe(iterable([1, 2, 3]), tap(cb), iterate)

    cb.should.have.been.calledThrice
    cb.lastCall.should.have.been.calledWith(3)
  })

  it('should also work with iterators.', () => {
    const cb = fake()
    const fn = () => {
      let i = 0

      return {
        next: () => {
          i++

          if (i === 1) { return { done: false, value: 42 } }
          else if (i === 2) { return { done: false, value: 43 } }
          else if (i === 3) { return { done: false, value: 61 } }
          else { return { done: true, value: undefined } }
        }
      }
    }

    pipe(iterable(fn()), tap(cb), iterate)

    cb.should.have.been.calledThrice
    cb.lastCall.should.have.been.calledWith(61)
  })

  it('should be pausable / resumable.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const pauser = sink({
      greet(tb) {
        tb.start()
        tb.request()
        tb.request()
        tb.stop()
        setTimeout(() => {
          tb.start()
          tb.request()
          tb.stop()
        }, 1000)
      }
    })

    pipe(iterable(['Jack', 'Jill', 'Johnny']), tap(cb), connect(pauser))

    cb.should.have.been.calledTwice
    cb.lastCall.should.have.been.calledWith('Jill')

    clock.tick(500)
    cb.should.have.been.calledTwice
    cb.lastCall.should.have.been.calledWith('Jill')

    clock.tick(1000)
    cb.should.have.been.calledThrice
    cb.lastCall.should.have.been.calledWith('Johnny')

    clock.restore()
  })
})
