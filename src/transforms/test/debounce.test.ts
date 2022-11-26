import { fake, useFakeTimers } from 'sinon'

import { debounce } from '../debounce'
import { Subject, interval } from '../../sources'
import { pipe, source, talkback } from '../../util'
import { tap, finalize, observe } from '../../sinks'
import { TrackFunc } from '../../types'


describe('debounce()', () => {
  it('should debounce incoming values. based on given time.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const src = new Subject()
    const debounced = debounce(src, 100)
    const tapped = tap(debounced, cb)
    const finalized = finalize(tapped, cb2)
    observe(finalized)

    src.receive(1)
    src.receive(2)
    cb.should.not.have.been.called

    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(2)

    src.receive(3)
    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(3)

    src.receive(4)
    src.end()
    clock.tick(100)
    cb.should.have.been.calledThrice
    cb.should.have.been.calledWith(4)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should handle normal end signals.', () => {
    const cb = fake()
    const clock = useFakeTimers()
    const src = new Subject()

    pipe(
      src,
      debounce(100),
      finalize(cb),
      observe,
    )

    src.receive(1)
    clock.tick(100)

    src.end(42)
    cb.should.have.been.calledOnceWith(42)

    clock.restore()
  })

  it('should debounce based on given source function.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = new Subject<number>()
    pipe(
      src,
      debounce(i => interval(i * 100)),
      tap(cb),
      observe,
    )

    src.receive(1)
    src.receive(7)
    clock.tick(100)
    cb.should.not.have.been.called

    clock.tick(600)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(7)

    clock.restore()
  })

  it('should debounce based on given promise function.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const src = new Subject<number>()
    pipe(
      src,
      debounce(i => sleep(i * 100)),
      tap(cb),
      observe,
    )

    src.receive(1)
    src.receive(7)
    clock.tick(100)
    cb.should.not.have.been.called

    clock.tick(600)
    await clock.nextAsync()
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(7)

    clock.restore()
  })

  it('should handle errors in wait function.', () => {
    const cb = fake()
    const cb2 = fake()
    const stop = fake()
    const src = source(sink => sink.greet(talkback({
      start() {
        sink.receive(42)
      },
      stop
    })))

    pipe(
      src,
      debounce(() => { throw new Error('boom') }),
      tap(cb),
      finalize(cb2),
      observe,
    )

    stop.should.have.been.calledOnce
    cb2.should.have.been.calledOnce
    cb.should.not.have.been.called
  })

  it('should support expressions.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const a = new Subject<number>()

    pipe(
      ($: TrackFunc) => $(a) * 2,
      debounce(100),
      tap(cb),
      observe,
    )

    a.receive(1)
    clock.tick(50)
    a.receive(2)
    clock.tick(50)

    cb.should.not.have.been.called

    clock.tick(50)
    cb.should.have.been.calledOnceWith(4)

    clock.restore()
  })
})
