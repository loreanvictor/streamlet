import { fake, useFakeTimers } from 'sinon'

import { batch } from '../batch'
import { Subject, iterable } from '../../sources'
import { pipe } from '../../util'
import { tap, finalize, observe } from '../../sinks'


describe('batch()', () => {
  it('should batch emissions in one event loop pass.', async () => {
    const clock = useFakeTimers()
    const cb = fake()

    const src = new Subject<number>()
    pipe(
      batch(src),
      tap(x => cb(x)),
      observe
    )

    src.receive(40)
    src.receive(41)
    src.receive(42)

    await clock.nextAsync()

    cb.should.have.been.calledOnceWith(42)

    clock.restore()
  })

  it('should invoke batch selector function when provided.', async () => {
    const clock = useFakeTimers()
    const cb = fake()

    const src = new Subject<number>()
    pipe(
      src,
      batch((i, b?: number[]) => b ? [...b, i] : [i]),
      tap(x => cb(x)),
      observe
    )

    src.receive(40)
    src.receive(41)
    src.receive(42)

    await clock.nextAsync()

    cb.should.have.been.calledOnceWith([40, 41, 42])

    clock.restore()
  })

  it('should release batched values when .release() is called.', async () => {
    const clock = useFakeTimers()
    const cb = fake()

    const src = new Subject<number>()
    const batched = batch(src)
    pipe(
      batched,
      tap(x => cb(x)),
      observe
    )

    src.receive(40)
    src.receive(41)

    batched.release()
    cb.should.have.been.calledOnceWith(41)

    src.receive(42)
    src.receive(43)

    await clock.nextAsync()

    cb.should.have.been.calledTwice
    cb.secondCall.should.have.been.calledWith(43)

    clock.restore()
  })

  it('should end when the source ends.', async () => {
    const clock = useFakeTimers()
    const cb = fake()
    const cb2 = fake()

    const src = new Subject()

    pipe(
      batch(src),
      tap(cb),
      finalize(cb2),
      observe
    )

    src.receive(42)
    src.end()
    cb2.should.have.been.calledOnce

    await clock.nextAsync()

    cb.should.not.have.been.called

    clock.restore()
  })

  it('should handle pausing / unpausing.', async () => {
    const clock = useFakeTimers()
    const cb = fake()

    const src = new Subject()

    const o = pipe(
      batch(src),
      tap(cb),
      observe
    )

    src.receive(42)
    o.stop()

    await clock.nextAsync()
    cb.should.not.have.been.called

    src.receive(43)
    o.start()

    await clock.nextAsync()
    cb.should.not.have.been.called

    src.receive(44)

    await clock.nextAsync()
    cb.should.have.been.calledOnceWith(44)

    clock.restore()
  })

  it('should properly handle iterables.', async () => {
    const clock = useFakeTimers()
    const cb = fake()

    const o = pipe(
      iterable([41, 42, 43]),
      batch(),
      tap(cb),
      observe
    )

    o.request()
    o.request()

    await clock.nextAsync()

    cb.should.have.been.calledOnceWith(42)

    clock.restore()
  })
})
