<div align="center">

<img src="/misc/logo-cutout.svg" width="128px"/>
  
# Memory Usage of Streamlets

</div>

<br><br>

Memory usage of some basic utilities in `streamlets` package is compared here to similar utilities on [Callbags](https://github.com/callbag/callbag)
and [RxJS](https://github.com/ReactiveX/rxjs). Different scenarios mimicking common use-cases are used for this benchmarking.

Overall, Streamlets consume less memory compared to Callbags and noticably less memory than RxJS. Benchmarking is conducted via monitoring
heap usage (`process.memoryUsage().heapUsed`) before and after each scenario was executed, with some warm up rounds for further stabilization.
The results displayed here were conducted on a MacBook Pro running macOS Catalina, and on [Node.js](https://nodejs.org/en/) (details below).

<details><summary>Environment Details</summary>

- **Hardware** \
  MacBook Pro 15-inch, Mid 2015 \
  2.2 GHz Quad-Core Intel Core i7 \
  16GB Mem DDR3

- **Runtime** \
  macOS Catalina Version 10.15.5 \
  Node.js v16.9.1 \
  TypeScript v4.4.3 \
  ts-node v9.0.0

- **Packages** \
  streamlets@0.2.1 \
  rxjs@7.4.0 \
  callbag-common@0.1.8 \
  callbag-subject@2.1.0 \
  benchmark@2.1.4

</details>

---

### Scneario: Simple Usage

For this scenario, 10,000 subjects were created, mapped and filtered (simple arithmetics), and then observed (subscribed to). Each subject
then emits 10 values.

<details><summary>Code</summary>

```ts
// Streamlets
const srcs = [...Array(10_000).keys()].map(() => new Subject<number>())
const subs = srcs.map(s =>
  pipe(
    s,
    map(x => x * 3),
    filter(x => x % 2 === 0),
    observe
  )
);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s.receive(x))
})
```
```ts
// RxJS
const srcs = [...Array(10_000).keys()].map(() => new Subject<number>())
const subs = srcs.map(s =>
  s.pipe(
    map(x => x * 3),
    filter(x => x % 2 === 0)
  )
    .subscribe()
);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s.next(x))
})
```
```ts
// Callbags
const srcs = [...Array(10_000).keys()].map(() => subject<number>())
const subs = srcs.map(s =>
  pipe(
    s,
    map(x => x * 3),
    filter(x => x % 2 === 0),
    subscribe(() => {})
  )
);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s(1, x))
})
```
</details>

| Lib                  | Heap Usage                     | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 7.46MB                         |  ±0.45%    | 32        |
| Callbags             | 13.97MB                        |  ±0.25%    | 32        |
| RxJS                 | 26.78MB                        |  ±0.65%    | 32        |

---
  
### Scneario: Flattening

For this scenario, 10,000 subjects were created, whose emissions are mapped to inner sources / observables each emitting 4 values synchronously, which are
subsequently filtered (simple arithmetic). The outer sources are then flattened, and the subjects emit 10 values each.

<details><summary>Code</summary>

```ts
// Streamlets
const srcs = [...Array(10_000).keys()].map(() => new Subject<number>())
const subs = srcs.map(s =>
  pipe(
    s,
    map(x => pipe(
      of(x, x, x * 2, x * 3),
      filter(y => y % 2 === 0),
    )),
    flatten,
    observe
  )
);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s.receive(x))
})
```
```ts
// RxJS
const srcs = [...Array(10_000).keys()].map(() => new Subject<number>())
const subs = srcs.map(s =>
  s.pipe(
    switchMap(x => of(x, x, x * 2, x * 3).pipe(filter(y => y % 2 === 0))),
  )
    .subscribe()
);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s.next(x))
})
```
```ts
// Callbags
const srcs = [...Array(10_000).keys()].map(() => subject<number>())
const subs = srcs.map(s =>
  pipe(
    s,
    map(x => pipe(
      of(x, x, x * 2, x * 3),
      filter(y => y % 2 === 0),
    )),
    flatten,
    subscribe(() => {})
  )
);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s(1, x))
})
```
</details>

| Lib                  | Heap Usage                     | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 8.73MB                         |  ±0.36%    | 32        |
| Callbags             | 20.05MB                        |  ±0.32%    | 32        |
| RxJS                 | 124.59MB                       |  ±0.15%    | 32        |

---
  
### Scneario: Multicasting

For this scenario, the same flow as [the previous scenario](#scenario-flattening) is used with 500 hundred subjects, who are then observed / subscribed to
50 times each. The subjects then similarly emit 10 values each.

<details><summary>Code</summary>

```ts
// Streamlets
const srcs = [...Array(500).keys()].map(() => new Subject<number>())
const subs = srcs.map(s => {
  const o = pipe(
    s,
    map(x => pipe(
      of(x, x, x * 2, x * 3),
      filter(y => y % 2 === 0),
    )),
    flatten,
  )

  return [...Array(50).keys()].map(() => observe(o))
}).flat();

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s.receive(x))
})
```
```ts
// RxJS
const srcs = [...Array(500).keys()].map(() => new Subject<number>())
const subs = srcs.map(s => {
  const o = s.pipe(
    switchMap(x => of(x, x, x * 2, x * 3).pipe(filter(y => y % 2 === 0))),
  )

  return [...Array(50).keys()].map(() => o.subscribe())
}).flat();

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s.next(x))
})
```
```ts
// Callbags
const srcs = [...Array(500).keys()].map(() => subject<number>())
const subs = srcs.map(s => {
  const o = pipe(
    s,
    map(x => pipe(
      of(x, x, x * 2, x * 3),
      filter(y => y % 2 === 0),
    )),
    flatten,
  )

  return [...Array(50).keys()].map(() => subscribe(() => {})(o))
}).flat();

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
  srcs.forEach(s => s(1, x))
})
```
</details>

| Lib                  | Heap Usage                     | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 17.18MB                        |  ±0.22%    | 32        |
| Callbags             | 18.21MB                        |  ±0.90%    | 32        |
| RxJS                 | 301.09MB                       |  ±0.06%    | 32        |

---

<br>

# Replication

```bash
# clone this repo
git clone git@github.com:loreanvictor/streamlet.git
```
```bash
# install dependencies
npm i
```
```bash
# run the performance benchmark
npm run bench:mem
```

You can also investigate and modify benchmarking codes in `benchmark/mem` folder.

<br><br>
