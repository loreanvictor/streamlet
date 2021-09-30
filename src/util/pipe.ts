
export function pipe<T1, T2>(first: T1, second: (a: T1) => T2): T2
export function pipe<T1, T2, T3>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
): T3
export function pipe<T1, T2, T3, T4>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
): T4
export function pipe<T1, T2, T3, T4, T5>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
  fifth: (a: T4) => T5,
): T5
export function pipe<T1, T2, T3, T4, T5, T6>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
  fifth: (a: T4) => T5,
  sixth: (a: T5) => T6,
): T6
export function pipe<T1, T2, T3, T4, T5, T6, T7>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
  fifth: (a: T4) => T5,
  sixth: (a: T5) => T6,
  seventh: (a: T6) => T7,
): T7
export function pipe<T1, T2, T3, T4, T5, T6, T7, T8>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
  fifth: (a: T4) => T5,
  sixth: (a: T5) => T6,
  seventh: (a: T6) => T7,
  eigth: (a: T7) => T8,
): T8
export function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
  fifth: (a: T4) => T5,
  sixth: (a: T5) => T6,
  seventh: (a: T6) => T7,
  eigth: (a: T7) => T8,
  ninth: (a: T8) => T9,
): T9
export function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  first: T1,
  second: (a: T1) => T2,
  third: (a: T2) => T3,
  fourth: (a: T3) => T4,
  fifth: (a: T4) => T5,
  sixth: (a: T5) => T6,
  seventh: (a: T6) => T7,
  eigth: (a: T7) => T8,
  ninth: (a: T8) => T9,
  tenth: (a: T9) => T10,
): T10

export function pipe(...cbs: any[]) {
  let res = cbs[0]
  for (let i = 1, n = cbs.length; i < n; i++) {
    res = cbs[i](res)
  }

  return res
}
