<div align="center">

<img src="/misc/logo-cutout.svg" width="128px"/>
  
# Performance of Streamlets

</div>

<br><br>

Performance of some basic utilities in `streamlets` package is compared here to similar utilities on [Callbags](https://github.com/callbag/callbag)
and [RxJS](https://github.com/ReactiveX/rxjs). Different scenarios mimicking common use-cases are used for this benchmarking, though it is notable that
in case of reactive programming libraries and utilities, performance is not always the most important factor (since a major contributor in such flows
is always time consumed by async computations anyways).

Overall, Streamlets are as fast as Callbags (marginally faster in some cases) and noticably faster than RxJS. [Benchmark.js](https://benchmarkjs.com) is used
for benchmarking, and the results displayed here were conducted on a MacBook Pro running macOS Catalina, and on [Node.js](https://nodejs.org/en/) (details below).

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

<img width="1013" alt="Screen Shot 2021-10-18 at 3 41 43 PM" src="https://user-images.githubusercontent.com/13572283/137743863-950f77bd-e2d7-4fd2-a6a5-c1f3fefd7225.png">

---

### Scneario: Simple Usage

For this scenario, 10 values were emitted synchronously, mapped and filtered (simple arithmetics) and then observed / subscribed to.

<details><summary>Code</summary>

```ts
// Streamlets
pipe(
  of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  map(x => x * 3),
  filter(x => x % 2 === 0),
  observe
)
```
```ts
// RxJS
of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
  .pipe(
    map(x => x * 3),
    filter(x => x % 2 === 0)
  )
  .subscribe()
```
```ts
// Callbags
pipe(
  of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  map(x => x * 3),
  filter(x => x % 2 === 0),
  subscribe(() => {})
)
```
</details>

| Lib                  | Performance                    | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 2,213,525 ops/sec              |  ±0.52%    | 90        |
| Callbags             | 1,830,351 ops/sec              |  ±39.45%   | 94        |
| RxJS                 | 683,889 ops/sec                |  ±1.31%    | 89        |

---

### Scenario: Flattening

For this scenario, 10 values were emitted synchronously, each value mapped to another source / observable which emits 4 values synchronously and is filtered (simple arithmetics). The outer source is then flattened and the whole stream is observed / subscribed to.

<details><summary>Code</summary>

```ts
// Streamlets
pipe(
  of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  map(x => pipe(
    of(x, x, x * 2, x * 3),
    filter(y => y % 2 === 0),
  )),
  flatten,
  observe
)
```
```ts
// RxJS
of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
  .pipe(
    switchMap(x => of(x, x, x * 2, x * 3).pipe(
      filter(y => y % 2 === 0),
    ))
  )
  .subscribe()
```
```ts
// Callbags
pipe(
  of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  map(x => pipe(
    of(x, x, x * 2, x * 3),
    filter(y => y % 2 === 0)
  )),
  flatten,
  subscribe(() => {})
)
```
</details>

| Lib                  | Performance                    | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 259,486 ops/sec                |  ±1.80%    | 90        |
| Callbags             | 231,507 ops/sec                |  ±0.46%    | 90        |
| RxJS                 | 99,086 ops/sec                 |  ±1.10%    | 90        |

---

### Scenario: Multicasting

For this scenario, a flow similar to [the previous scenario](#scenario-flattening) is used, except the sources are subjects, and each is observed / subscribed to by 9 different observers / subscribers. Each subject then emits 10 values.

<details><summary>Code</summary>

```ts
// Streamlets
const sub = new Subject<number>()

const o = pipe(
  sub,
  map(x => pipe(
    of(x, x, x * 2, x * 3),
    filter(y => y % 2 === 0),
  )),
  flatten,
)

observe(o)
observe(o)
observe(o)
observe(o)
observe(o)
observe(o)
observe(o)
observe(o)
observe(o)

for (let i = 0; i < 10; i++) { sub.receive(i) }
sub.end()
```
```ts
// RxJS
const s = new Subject<number>()
const o = s.pipe(
  switchMap(x => of(x, x, x * 2, x * 3).pipe(
    filter(y => y % 2 === 0),
  ))
)

o.subscribe()
o.subscribe()
o.subscribe()
o.subscribe()
o.subscribe()
o.subscribe()
o.subscribe()
o.subscribe()
o.subscribe()

for (let i = 0; i < 10; i++) { s.next(i) }
s.complete()
```
```ts
// Callbags
const s = subject<number>()

const o = pipe(
  s,
  cbmap(x => pipe(
    cbof(x, x, x * 2, x * 3),
    cbfilter(y => y % 2 === 0)
  )),
  cbflatten,
)

cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)
cbsubscribe(() => {})(o)

for (let i = 0; i < 10; i++) { s(1, i) }
s(2)
```
</details>

| Lib                  | Performance                    | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 28,927 ops/sec                 |  ±0.25%    | 90        |
| Callbags             | 21,553 ops/sec                 |  ±2.71%    | 92        |
| RxJS                 | 10,159 ops/sec                 |  ±1.98%    | 91        |
  
---
  
### Scenario: Large Data

For this scenario, a flow similar to [flattening scenario](#scenario-flattening) is used, except with 10,000 emitted values instead of 10.
  
<details><summary>Code</summary>

```ts
const data = [...Array(10_000).keys()]
```
```ts
// Streamlets
pipe(
  of(...data),
  map(x => pipe(
    of(x, x, x * 2, x * 3),
    filter(y => y % 2 === 0),
  )),
  flatten,
  observe
)
```
```ts
// RxJS
of(...data)
  .pipe(
    switchMap(x => of(x, x, x * 2, x * 3).pipe(
      filter(y => y % 2 === 0),
    ))
  )
  .subscribe()
```
```ts
// Callbags
pipe(
  of(...data),
  map(x => pipe(
    of(x, x, x * 2, x * 3),
    filter(y => y % 2 === 0)
  )),
  flatten,
  subscribe(() => {})
)
```
</details>
  
| Lib                  | Performance                    | RME        | # of Runs |
| -------------------- | ------------------------------ | ---------- | --------- |
| Streamlets           | 216 ops/sec                    |  ±1.27%    | 83        |
| Callbags             | 199 ops/sec                    |  ±0.58%    | 83        |
| RxJS                 | 107 ops/sec                    |  ±0.37%    | 77        |

---

<br>
  
# Considerations
  
This benchmark focuses on RxJS and Callbags as they are the closest analogues to Streamlets, with similar APIs. However, there are other
reactive programming libraries out there (such as [MOST](https://github.com/cujojs/most) and [xstream](https://github.com/staltz/xstream)) that
are at least situationally comparable.

Due to their inherent differences though, these libraries were omitted from this benchmark, as it would make interpreting the results more difficult.
For example xstream is generally slower than Callbags and Streamlets (faster than RxJS), but on multicasting
it has a massive advantage, despite it actively discouraging subject-like behavior. This is due to the fact that xstream is designed
around and supports only hot steams, so it excells at multicasting while it lags behind in scenarios where cold streams would
do the trick.  

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
npm run bench:perf
```

You can also investigate and modify benchmarking codes in `benchmark/perf` folder.

<br><br>
