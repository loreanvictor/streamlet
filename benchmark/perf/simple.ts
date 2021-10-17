import { benchmark } from './util/benchmark'

import { pipe, of, map, filter, observe } from '../../src'
import { of as rxof, map as rxmap, filter as rxfilter } from 'rxjs'
import { of as cbof, map as cbmap, filter as cbfilter, subscribe as cbsubscribe } from 'callbag-common'


benchmark('simple', {

  RxJS: () => {
    rxof(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      .pipe(
        rxmap(x => x * 3),
        rxfilter(x => x % 2 === 0)
      )
      .subscribe()
  },

  Callbags: () => {
    pipe(
      cbof(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      cbmap(x => x * 3),
      cbfilter(x => x % 2 === 0),
      cbsubscribe(() => {})
    )
  },

  Streamlets: () => {
    pipe(
      of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      map(x => x * 3),
      filter(x => x % 2 === 0),
      observe
    )
  }
})
