import { fake, useFakeTimers } from 'sinon'

import { throttle } from '../throttle'
import { pipe, source, talkback } from '../../util'
import { Subject, interval } from '../../sources'
import { tap, finalize, observe } from '../../sinks'
import { expect } from 'chai'
import { TrackFunc } from '../../types'


describe('throttle()', () => {
  it('should throttle incoming values. based on given time.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = new Subject()
    const throttled = throttle(src, 100)
    const tapped = tap(throttled, cb)
    const finalized = finalize(tapped, cb2)
    observe(finalized)

    src.receive(1)
    src.receive(2)
    cb.should.have.been.calledWith(1)

    clock.tick(100)
    cb.should.have.been.calledOnce

    src.receive(4)
    src.end()
    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(4)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should throttle based on given source function.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = new Subject<number>()
    pipe(
      src,
      throttle(i => interval(i * 100)),
      tap(cb),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)
    src.receive(7)
    clock.tick(100)
    src.receive(8)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(8)

    clock.restore()
  })

  it('should debounce based on given promise function.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const src = new Subject<number>()
    pipe(
      src,
      throttle(i => sleep(i * 100)),
      tap(cb),
      observe,
    )

    src.receive(1)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)
    src.receive(7)
    clock.tick(100)
    await clock.nextAsync()
    src.receive(8)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(8)

    clock.restore()
  })

  it('should handle errors in wait function.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()
    const src = source(sink => sink.greet(talkback({
      start() {
        sink.receive(42)
        sink.receive(43)
      },
      stop,
    })))

    pipe(
      src,
      throttle(() => { throw new Error('boom') }),
      tap(cb),
      finalize(cb2),
      observe,
    )

    stop.should.have.been.calledOnce
    cb2.should.have.been.calledOnce
    cb.should.have.been.calledOnce
  })

  it('should properly handle end signals when not waiting.', () => {
    const src = new Subject()
    const cb = fake()

    expect(() => {
      pipe(src, throttle(100), finalize(cb), observe)
      src.end()

      cb.should.have.been.calledOnce
    }).to.not.throw()
  })

  it('should support expressions.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = new Subject<number>()
    pipe(
      ($: TrackFunc) => $(src) * 2,
      throttle(() => interval(100)),
      tap(cb),
      observe,
    )

    src.receive(1)
    src.receive(2)
    cb.should.have.been.calledWith(2)

    clock.tick(100)
    cb.should.have.been.calledOnce

    src.receive(4)
    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(8)

    clock.restore()
  })
})

