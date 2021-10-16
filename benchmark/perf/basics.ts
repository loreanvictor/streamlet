import { benchmark } from './util/benchmark'

import { pipe, of, map, filter, observe } from '../../src'
import { of as rxof, map as rxmap, filter as rxfilter } from 'rxjs'
import { of as cbof, map as cbmap, filter as cbfilter, subscribe as cbsubscribe } from 'callbag-common'
import { from as mfrom } from 'most'
import xs from 'xstream'


benchmark('basics', {

  'no library': () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
      .map(x => x * x)
      .filter(x => x % 2 === 0)
      .forEach(() => {})
  },

  xstream: () => {
    xs.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
      .map(x => x * 3)
      .filter(x => x % 2 === 0)
      .addListener({ next: () => {} })
  },

  RxJS: () => {
    rxof(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
      .pipe(
        rxmap(x => x * 3),
        rxfilter(x => x % 2 === 0)
      )
      .subscribe()
  },

  Callbags: () => {
    pipe(
      cbof(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20),
      cbmap(x => x * 3),
      cbfilter(x => x % 2 === 0),
      cbsubscribe(() => {})
    )
  },

  Streamlets: () => {
    pipe(
      of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20),
      map(x => x * 3),
      filter(x => x % 2 === 0),
      observe
    )
  },

  MOST: () => {
    mfrom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
      .map(x => x * 3)
      .filter(x => x % 2 === 0)
      .observe(() => {})
  }
})
