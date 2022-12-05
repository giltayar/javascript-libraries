# functional-commons

A library with lots of utility functions. Along with
`@giltayar/promise-commons`, they are my "lodash" replacement and contain things
we would have liked to see in a javascript standard library.

This library is ESM-only (does not support `require`-ing it).

## Installation

```sh
npm install @giltayar/functional-commons
```

## Basic use

Given that this package is just a set of functions, just import
the ones you want and you're good to go.

An example of using a function from the package:

```js
import {mapValues} from '@giltayar/functional-commons'

console.log(mapValues({a: 4, b: 5}, (x) => x * 2)) // {a: 8, b: 10}
```

Another example:

```js
import {range} from '@giltayar/functional-commons'

for (const i of range(0, 10)) {
  console.log(i)
}
// ==> 0 1 2 3 4 5 6 7 8 9 (each number in its own line)
```

## API

### `memo(syncFunction)`

Memoize a synchronous function. You can find the asynchronous version (`memoAsync`) below.

Example:

```js
import {range} from '@giltayar/functional-commons'

let called = 0
const twice = memo((x) => {
  ++called
  return x * 2
})

console.log(twice(4)) // 8
console.log(twice(3)) // 6
console.log(twice(4)) // 8
console.log(twice(4)) // 8
console.log(called)   // 2
```

### `memoAsync(asyncFunction, {expireAfterMs})`

Memoize an async function. To make it refresh every so often,
you can make the cached result expire after some time using `expireAfterMs`

Example:

```js
import {memoAsync} from '@giltayar/functional-commons'
import {fetchAsJSON} from '@giltayar/http-commons'
import {delay} from '@giltayar/promise-commons'

let called = 0
const starWarsPersonName = memoAsync(async(id) => {
  ++called
  return (await fetchAsJSON(new URL(`/people/${id}`, 'https://swapi.dev/api/'))).name
})

console.log(await starWarsPersonName(1)) // Luke Skywalker
console.log(await starWarsPersonName(2, {expireAfterMs: 1000})) // C-3PO
console.log(await starWarsPersonName(1)) // Luke Skywalker
await delay(1000)
console.log(await starWarsPersonName(2)) // C-3PO
console.log(called) // 3
```

### `range(from, to, step = 1)`

Return an array with numbers ranging `from`...`to` (exclusive), using an optional `step`.

Example:

```js
import {range} from '@giltayar/functional-commons'

for (const i of range(0, 10)) {
  console.log(i)
}
// ==> 0 1 2 3 4 5 6 7 8 9 (each number in its own line)

for (const i of range(0, 10, 2)) {
  console.log(i)
}
// ==> 0 2 4 6 8 (each number in its own line)
```

### `randomBetween(from, to)`

Returns a random number (using `Math.random`) between `from` and `to`
(inclusive of `from`, but exclusive of `to`)

```js
import {randomBetween} from '@giltayar/functional-commons'

for (const i of range(0, 5)) {
  console.log(randomBetween(3, 6))
}
// ==> 4.5
// ==> 3
// ==> 3.188   (example numbers. actual number will be random)
// ==> 5.99
// ==> 3.45
```

### `sum(arrayOfNumbers)`

Returns the sum of an array of numbers

Example:

```js
import {sum} from '@giltayar/functional-commons'

console.log(sum([1, 4, 6])) // 11
console.log(sum([])) // 0
```

### `throw_(anything)`

This is throw as a function.

```js
import {throw_, randomBetween} from '@giltayar/functional-commons'

const r = randomBetween(0, 10)
console.log(r <= 0.5 ? r : throw_(new Error('random number is too big!'))
```

### `group(prop, list)`

Group a list of objects based on a property common to all objects.

Example:

```js
import {group} from '@giltayar/functional-commons'

const items = [
  {type: 'a', value: 120},
  {type: 'a', value: 1},
  {type: 'b', value: 4},
  {type: 'c', value: 1},
  {type: 'c', value: 2},
]

console.log(group('type', items))
// ==> {
//       a: [
//         {type: 'a', value: 120},
//         {type: 'a', value: 140},
//       ],
//       b: [
//         {type: 'b', value: 4},
//       ],
//       c: [
//         {type: 'c', value: 1},
//         {type: 'c', value: 2},
//       ],
//     }
```

### `mapObject/Values/Keys(object, mapFunction)`

`map` for objects.

* `mapObject`: the `mapFunction` will receive the key and value of each object entry
   and transforms them.
* `mapValues`: the `mapFunction` will receive the value of each object entry
   and transforms it.
* `mapKeys`: the `mapFunction` will receive the key of each object entry
   and transforms it.

Example:

```js
import {mapObject, mapValues, mapKeys} from '@giltayar/functional-commons'

const object = {a: 4, b: 5}

console.log(mapObject(object, (key, value) => [key + 'x2', value => value * 2])) // {ax2: 8, bx2: 10}
console.log(mapValues(object, (value) => [value => value * 2])) // {a: 8, b: 10}
console.log(mapKeys(object, (key) => [key => key + 'ooo'])) // {aooo: 4, booo: 5}
```

### `filterEntries/Values/Keys(object, filterFunction)`

`filter` for objects.

* `filterEntries`: the `filterFunction` will receive the key and value of each object entry
   and decide whether the entry is include.
* `filterValues`: the `filterFunction` will receive the value of each object entry
   and decide whether the entry is include.
* `filterKeys`: the `filterFunction` will receive the key of each object entry
   and decide whether the entry is include.

Example:

```js
import {filterEntries, filterValues, filterKeys} from '@giltayar/functional-commons'

const object = {a: 4, b: 5, c: 6, d: 7}

console.log(filterEntries(object, (key, value) => key <= 'b' && value % 2)) // {b: 5}
console.log(filterValues(object, (value) => value % 2)) // {b: 5, d: 7}
console.log(filterKeys(object, (key) => key <= 'b')) // {a: 4, b: 5}
```

### `makeError(error, properties)`

Creates an error and adds properties to it. `error` can be a string, in which case an `Error`
will be created from it, or anything else (usually an `Error`), in which case the `properties`
will be added to it (it will be mutated and returned).

Example:

```js
import {makeError} from '@giltayar/functional-commons'

console.error(makeError('really bad', {code: 'ERR_REALLY_BAD'})) // Error: really bad
                                                                 // ...
                                                                 // code: 'ERR_REALLY_BAD'
try {
  throw new Error('not so bad')
} catch (error) {
  console.error(makeError(error, {code: 'ERR_MOSTLY_OK'})) // Error: not so bad
                                                            // ...
                                                            // code: 'ERR_MOSTLY_OK'
}
```

### `zip(leftArray, rightArray)`

Classic functional "zip" function, which merges to array into an array of tuples. If one
of the arrays is smaller than the other, the resulting item in the tuple will be `undefined`.

Example:

```js
import {zip, range} from '@giltayar/functional-commons'

const array = ['a', 'b', 'c']
for (const [item, i] of zip(array, range(0, array.length + 1))) {
  console.log(item, i)
}
// ==>
//  a 0
//  b 1
//  c 2
//  undefined 2
```

### `minus(bigArray, smallArray)`

Set-like "minus" operation, which removes all `smallArray` items from `bigArray`.

Example:

```js
import {minus} from '@giltayar/functional-commons'

console.log(minus([1, 2, 3, 4, 5, 6, 7], [2, 4, 6, 8])) // [1, 3, 5, 7]
```

### `diff(bigArray, smallArray)`

Set-like "intersection" operation, which removes all `smallArray` items from `bigArray`.
and vice-versa.

Example:

```js
import {diff} from '@giltayar/functional-commons'

console.log(diff([1, 2, 3, 4, 5, 6, 7], [2, 4, 6, 8])) // [2, 4, 6]
```

### `pick(object, propertyNames)`

Classic lodash "pick", which returns a copy of `object` with only the properties defined in `propertyNames`.
If `object` is `null` or `undefined`, will return `object` as is.

Example:

```js
import {pick} from '@giltayar/functional-commons'

console.log({a: 4, b: 5, c: 6}, ['a', 'c']) // {a: 4, c: 6}
```

### `filterOutNullOrUndefined(array)`

Filters our `null` or `undefined` values in an array. Note that this function is TypeScript safe
in that if the array is an array of item type that includes `null` or `undefined`, then the result
array item type will _not_ include `null` or `undefined`.

Example:

```js
import {filterOutNullOrUndefined} from '@giltayar/functional-commons'

console.log(filterOutNullOrUndefined([1, undefined, 3, null, 4, undefined])) // [1, 3, 4]
```

### `chunk(array, chunkSize)`

returns an array of arrays, where concating the array of arrays will return `array`, but each
item in the array of arrays has a size <= `chunkSize`.

Example:

```js
import {chunk, range} from '@giltayar/functional-commons'

console.log(chunk(range(1, 9), 3)) // [[1, 2, 3], [4, 5, 6], [7, 8]]
```

### `clone(value)`

Clones a JS value. The value can be any primitive (including null or undefined), a `Date`,
a symbol, an array or an object containing (recursively) anything that can be clones, an object.

Functions are also treated, but they continue to be cloned by reference

Any object will be cloned along with its prototype and its enumerable properties. The constructor
will NOT be called.

Example:

```js
import {clone} from '@giltayar/functional-commons'
import assert from 'assert'

const object = {
  a: 'aaaa',
  b: 5,
  c: ['a', 'b', 'c', new Date(), {
    d: Symbol(),
    e: true,
    f: [null, undefined, 4n, () => 1]
  }],
}
assert.deepStrictEqual(clone(object), object)
```

## Contributing

See the documentation on contributing code to packages in this monorepo
[here](../../CONTRIBUTING.md).

### License

MIT


