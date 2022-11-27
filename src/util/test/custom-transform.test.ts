import { fake, useFakeTimers } from 'sinon'

import { transform } from '../custom-transform'
import { Source } from '../../types'
import { Subject, interval, combine } from '../../sources'
import { distinctBy, scan, map } from '../../transforms'
import { observe, tap } from '../../sinks'
import { source, sink, pipe } from '../../util'


describe('transform()', () => {
  it('should auto-curry the given transform.', () => {
    const cb = fake()

    const mul = transform(
      (src: Source<number>, n: number) => source<number>(
        snk => src.connect(sink({
          receive: (t) => snk.receive(t * n),
        }, snk))
      )
    )

    const src = new Subject<number>()

    pipe(
      src,
      mul(2),
      tap(x => cb(x)),
      observe
    )

    src.receive(2)
    cb.should.have.been.calledWith(4)

    src.receive(3)
    cb.should.have.been.calledWith(6)
  })

  it('should also work in non-curried manner.', () => {
    const cb = fake()

    const mul3 = transform(
      (src: Source<number>) => source<number>(
        snk => src.connect(sink({
          receive: (t) => snk.receive(t * 3),
        }, snk))
      )
    )

    const src = new Subject<number>()

    pipe(
      mul3(src),
      tap(x => cb(x)),
      observe
    )

    src.receive(2)
    cb.should.have.been.calledWith(6)

    src.receive(3)
    cb.should.have.been.calledWith(9)
  })

  it('should support transforms with a second source argument if minargs is provided.', () => {
    const clock = useFakeTimers()

    const sample: {
      (notifier: Source<unknown>): (<U>(src: Source<U>) => Source<U>)
      <T>(src: Source<T>, notifier: Source<unknown>): Source<T>
    } = transform(<T>(src: Source<T>, notifier: Source<unknown>) => {
      const counter = scan(notifier, c => c + 1, 0)
      const combined = combine(src, counter)
      const sampled = distinctBy(combined, (a, b) => a[1] === b[1])

      return map(sampled, ([t]) => t)
    }, 2)

    const cb = fake()

    const sub = new Subject<number>()
    const timer = interval(100)

    pipe(
      sub,
      sample(timer),
      tap(x => cb(x)),
      observe
    )

    sub.receive(1)
    sub.receive(2)

    cb.should.not.have.been.called

    clock.tick(100)
    cb.should.have.been.calledOnceWith(2)

    sub.receive(3)
    sub.receive(4)

    cb.should.have.been.calledOnce

    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(4)

    clock.restore()
  })
})
