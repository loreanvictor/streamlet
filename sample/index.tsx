/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import sleep from 'sleep-promise'

import { interval, next, pullBuffer } from '../src'

const f = async () => {
  for await (const x of next(pullBuffer(interval(500)))) {
    console.log(x)
    await sleep(1000)
  }
}

f()
