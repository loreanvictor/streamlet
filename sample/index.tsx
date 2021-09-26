/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, map, flatten, observe, observeLater, take, merge, Subject, tap, greet, filter,
  iterable, iterate, replay, share, debounce, throttle, combine, startWith, finalize,
  connect, source, sink, talkback, Source, Sink, Talkback, pullrate, of, event, scan,
  fetch, promise, retry,
} from '../src'


// const mguru = (index: number) => source(s => {
//   const list = ['A', 'B', 'C']
//   let c = 0

//   s.greet(talkback({
//     request() {
//       if (c < list.length) {
//         s.receive(list[c++] + index)
//       } else {
//         s.end()
//       }
//     }
//   }))
// })


// const guru: Source<Source<string>> = source(s => {
//   let c = 0
//   s.greet(talkback({
//     request() {
//       if (c < 10) {
//         s.receive(mguru(c++))
//       } else {
//         s.end()
//       }
//     }
//   }))
// })

// pipe(
//   guru,
//   pullrate(1000),
//   map(g => pullrate(g, 500)),
//   flatten,
//   tap(console.log),
//   iterate,
// )

pipe(
  fetch('https://pokeapi.co/api/v2/pokemon/ditto'),
  map(r => promise(r.json())),
  flatten,
  pullrate(1000),
  map(r => r.name),
  tap(console.log),
  observe,
  // iterate,
)
