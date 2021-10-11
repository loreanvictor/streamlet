/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, observe,tap,
} from '../src'


const src = pipe(
  interval(1000),
  tap(console.log)
)

const obs1 = observe(src)
const obs2 = observe(src)

setTimeout(() => obs1.stop(), 3000)
setTimeout(() => obs1.start(), 5000)
