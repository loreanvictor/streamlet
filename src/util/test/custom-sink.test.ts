import { fake } from 'sinon'

import { sink } from '../custom-sink'
import { Subject } from '../../sources'
import { connect } from '../../util'


describe('sink()', () => {
  it('should create a sink from given functions.', () => {
    const greet = fake()
    const receive = fake()
    const end = fake()

    const snk = sink({
      greet(t) {
        greet(t)
        t.start()
      },
      receive,
      end,
    })

    const sub = new Subject()
    connect(sub, snk)

    greet.should.have.been.calledOnce

    sub.receive('hellow')
    receive.should.have.been.calledOnceWith('hellow')

    sub.end(42)
    end.should.have.been.calledOnceWith(42)
  })

  it('should extend behavior of second argument.', () => {
    const greet = fake()
    const receive = fake()
    const end = fake()

    const snk = sink({}, {
      greet(t) {
        greet(t)
        t.start()
      },
      receive,
      end,
    })

    const sub = new Subject()
    connect(sub, snk)

    greet.should.have.been.calledOnce

    sub.receive('hellow')
    receive.should.have.been.calledOnceWith('hellow')

    sub.end(42)
    end.should.have.been.calledOnceWith(42)
  })
})
