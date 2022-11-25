import { fake, useFakeTimers } from 'sinon'

import { backpress } from '../backpress'
import { interval, Subject } from '../../sources'
import { tap, finalize, iterate, observe } from '../../sinks'
import { pullrate, map } from '..'
import { pipe } from '../../util'
import { TrackFunc } from '../../types'


describe('backpress()', () => {
  it('should apply back pressure whenever necessary.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    pipe(
      interval(100),
      backpress,
      pullrate(200),
      tap(cb),
      iterate
    )

    clock.tick(200)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(0)

    clock.tick(100)
    cb.should.have.been.calledOnce

    clock.tick(200)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)

    clock.restore()
  })

  it('should only apply back pressure when it is needed.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    pipe(
      interval(100),
      backpress,
      pullrate(50),
      tap(cb),
      iterate
    )

    clock.tick(100)
    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(0)

    clock.tick(100)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(1)

    clock.restore()
  })

  it('should pass down errors.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    pipe(
      interval(100),
      map(() => { throw new Error('test') }),
      backpress,
      pullrate(50),
      tap(cb),
      finalize(cb2),
      iterate
    )

    clock.tick(100)
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should support expressions.', () => {
    const cb = fake()

    const a = new Subject<number>()

    const o = pipe(
      ($: TrackFunc) => $(a) * 2,
      backpress,
      tap(x => cb(x)),
      observe,
    )

    a.receive(1)
    cb.should.not.have.been.called

    o.request()
    cb.should.have.been.calledOnceWith(2)

    a.receive(2)
    cb.should.have.been.calledOnce

    o.request()
    cb.should.have.been.calledOnce

    a.receive(3)
    cb.should.have.been.calledTwice
    cb.should.have.been.calledWith(6)
  })
})

