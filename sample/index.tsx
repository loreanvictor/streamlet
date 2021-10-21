/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { of, next } from '../src'


const f = async () => {
  for await (const x of next(of(1, 2, 3))) {
    console.log(x)
  }
}

f()
