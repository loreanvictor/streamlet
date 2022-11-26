import { fake, useFakeTimers } from 'sinon'

import { connectRate } from '../connect-rate'
import { Subject } from '../../sources'
import { pipe, connect, sink } from '../../util'


describe('connectRate()', () => {
  it('should control the rate at which sinks can connect to given source.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const sub = new Subject()
    const crt = connectRate(sub, 100)

    const snk = (greet: any) => sink({ greet })
    const sA = snk(cb)
    const sB = snk(cb2)

    connect(crt, sA)
    cb.should.have.been.calledOnce

    connect(crt, sB)
    cb2.should.not.have.been.called

    clock.tick(100)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should also work with a pipeable syntax', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const sub = new Subject()
    const crt = pipe(sub, connectRate(100))

    const snk = (greet: any) => sink({ greet })
    const sA = snk(cb)
    const sB = snk(cb2)

    pipe(crt, connect(sA))
    cb.should.have.been.calledOnce

    pipe(crt, connect(sB))
    cb2.should.not.have.been.called

    clock.tick(100)
    cb2.should.have.been.calledOnce

    clock.restore()
  })

  it('should support expressions.', () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    const sub = new Subject<any>()
    const crt = connectRate($ => $(sub) * 2, 100)

    const snk = (greet: any) => sink({ greet })
    const sA = snk(cb)
    const sB = snk(cb2)

    connect(crt, sA)
    cb.should.have.been.calledOnce

    connect(crt, sB)
    cb2.should.not.have.been.called

    clock.tick(100)
    cb2.should.have.been.calledOnce

    clock.restore()
  })
})
