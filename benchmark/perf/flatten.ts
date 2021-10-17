import { benchmark } from './util/benchmark'

import { pipe, of, map, flatten, filter, observe } from '../../src'
import { of as rxof, switchMap, filter as rxfilter } from 'rxjs'
import { of as cbof, map as cbmap, flatten as cbflatten, filter as cbfilter, subscribe as cbsubscribe } from 'callbag-common'


benchmark('flatten', {

  RxJS: () => {
    rxof(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      .pipe(
        switchMap(x => rxof(x, x, x * 2, x * 3).pipe(
          rxfilter(y => y % 2 === 0),
        ))
      )
      .subscribe()
  },

  Callbags: () => {
    pipe(
      cbof(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      cbmap(x => pipe(
        cbof(x, x, x * 2, x * 3),
        cbfilter(y => y % 2 === 0)
      )),
      cbflatten,
      cbsubscribe(() => {})
    )
  },

  Streamlets: () => {
    pipe(
      of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      map(x => pipe(
        of(x, x, x * 2, x * 3),
        filter(y => y % 2 === 0),
      )),
      flatten,
      observe
    )
  },
})
