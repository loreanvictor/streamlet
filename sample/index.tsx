/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry,
} from '../src'



const pauser = () => {
  let tb: Talkback
  let count = 0

  return sink({
    greet: _tb => { (tb = _tb).start(); tb.request() },
    receive: t => {
      console.log(t)
      count++

      if (count === 2) {
        console.log('PAUSING ...')
        tb.stop()
        setTimeout(() => {
          console.log('RESUMING ...')
          tb.start()
          tb.request()
        }, 2000)
      } else {
        tb.request()
      }
    },
  })
}

const twoiter = () => {
  let tb: Talkback
  let count = 0

  return sink({
    greet: _tb => {
      (tb = _tb).start()
      tb.request()
    },

    receive: () => {
      count++
      if (count >= 2) {
        tb.stop()
      } else if (count === 1) {
        tb.stop()
        setTimeout(() => { tb.start(); tb.request() }, 1000)
      } else {
        tb.request()
      }
    }
  })
}


const guru = source(s => s.greet(talkback({
  request() { s.receive('GURU') }
})))


pipe(
  of(2, 3, 4),
  map(x => {
    if (x % 2 === 1) {
      throw new Error('Odd number')
    } else {
      return x
    }
  }),
  retry(2),
  tap(x => console.log(x)),
  finalize(() => console.log('END')),
  observe,
)

// pipe(
//   fetch('https://pokeapi.co/api/v2/pokemon/ditto'),
//   take(1),
//   map(res => promise(res.json())),
//   pullrate(1000),
//   flatten,
//   map(res => res.abilities.map((ability: any) => ability.ability.name).join(',')),
//   tap(console.log),
//   // observe,
//   iterate,
// )
