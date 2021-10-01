import { fake } from 'sinon'
import { testRender } from 'test-callbag-jsx'

import { event } from '../event'
import { pipe } from '../../util'
import { tap, observe } from '../../sinks'


describe('event()', () => {
  it('should emit events of given element.', () => {
    testRender((renderer, {render, $}) => {
      const cb = fake()
      render(<button/>)
      const ob = pipe(
        event($('button').resolveOne()!, 'click'),
        tap(cb),
        observe
      )

      cb.should.not.have.been.called

      $('button').click()
      cb.should.have.been.calledOnce

      $('button').click()
      cb.should.have.been.calledTwice

      ob.stop()
      cb.resetHistory()

      $('button').click()
      cb.should.not.have.been.called

      ob.start()
      $('button').click()
      cb.should.have.been.calledOnce
    })
  })
})


