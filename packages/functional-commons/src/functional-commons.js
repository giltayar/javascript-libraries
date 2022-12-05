/**
 * @template T
 * @typedef {{type: 'success'; value: T}} Success
 */

/**
 * @template E
 * @typedef {{type: 'error'; error: E}} Failure
 */

/**
 * @template T, E
 * @typedef {Success<T> | Failure<E>} Result
 */

/**
 * @template T
 * @param {T} value
 * @returns {Success<T>}
 */
export function successResult(value) {
  return {type: 'success', value}
}

/**
 * @template E
 * @param {E} error
 * @returns {Failure<E>}
 */
export function failureResult(error) {
  return {type: 'error', error}
}

/**
 * @template T, E
 * @param {Result<T, E>} result
 * @returns {result is Success<T>}
 */
export function isResultOk(result) {
  return result.type === 'success'
}

/**
 * @template T, E
 * @param {Result<T, E>} result
 * @returns {result is Failure<E>}
 */
export function isResultError(result) {
  return result.type === 'error'
}

/**
 * @template {any[]} P, T
 * @param {(...args: P) => T} syncCreationFunction
 * @returns {(...args: P) => T}
 */
export function memo(syncCreationFunction) {
  /** @type {Map<string, T>} */
  const cacheMap = new Map()

  return (...args) => {
    const key = JSON.stringify(args)

    const cachedValue = cacheMap.get(key)
    if (cachedValue) {
      return cachedValue
    }
    const newValue = syncCreationFunction(...args)
    if (typeof (/** @type {any} */ (newValue).then) === 'function')
      throw new Error('your function returned a promise. Maybe you want to use cacheFunctionAsync?')

    cacheMap.set(key, newValue)

    return newValue
  }
}

/**
 * @template {any[]} P, T
 * @param {(...args: P) => PromiseLike<T>} asyncCreationFunction
 * @param {{expireAfterMs?: number; nowService?: () => number}} options
 * @returns {(...args: P) => PromiseLike<T>}
 */
export function memoAsync(
  asyncCreationFunction,
  {expireAfterMs = undefined, nowService = Date.now} = {},
) {
  /** @type {Map<string, {value: T; creationTime: number}>} */
  const cacheMap = new Map()

  return async (...args) => {
    const key = JSON.stringify(args)

    const cachedValue = cacheMap.get(key)
    if (cachedValue) {
      const {value, creationTime} = cachedValue

      if (expireAfterMs === undefined || nowService() < creationTime + expireAfterMs) {
        return value
      }
    }
    const newValue = await asyncCreationFunction(...args)

    cacheMap.set(key, {value: newValue, creationTime: nowService()})

    return newValue
  }
}

/**
 * @param {number} from
 * @param {number} to
 * @param {number} [step]
 * @returns {number[]}
 */
export function range(from, to, step = 1) {
  if (from >= to) return []

  return Array(Math.ceil((to - from) / step))
    .fill(0)
    .map((_, i) => i * step + from)
}

/**
 * @param {number} lower
 * @param {number} limit
 */
export function randomBetween(lower, limit) {
  return Math.random() * (limit - lower) + lower
}

/**
 * @param {number[]} numbers
 * @returns {number}
 */
export function sum(numbers) {
  return numbers.reduce((a, b) => a + b, 0)
}

/**
 * @param {Error} err
 * @returns {never}
 */
export function throw_(err) {
  throw err
}
/** @typedef {string | number | symbol} ObjectKeyType */

/**
 * @template T
 * @template {keyof T} K
 * @param {K} prop
 * @param {T[]} list
 * @returns {Record<string, T[]>}
 */
export function group(prop, list) {
  return list.reduce(function (grouped, item) {
    const key = item[prop]

    //@ts-expect-error
    grouped[key] = grouped[key] || []
    //@ts-expect-error
    grouped[key].push(item)

    return grouped
  }, {})
}

/**
 * @template {ObjectKeyType} K
 * @template {ObjectKeyType} L
 * @template T
 * @template W
 * @param {Record<K, T>} object
 * @param {(k: K, t: T) => [L, W]} mapFunction
 * @returns {Record<L, W>}
 */
export function mapObject(object, mapFunction) {
  //@ts-expect-error
  return Object.fromEntries(Object.entries(object).map(([key, value]) => mapFunction(key, value)))
}

/**
 * @template {ObjectKeyType} K
 * @template T
 * @template W
 * @param {Record<K, T>} object
 * @param {(t: T) => W} mapFunction
 * @returns {Record<K, W>}
 */
export function mapValues(object, mapFunction) {
  return mapObject(object, (key, value) => [key, mapFunction(value)])
}

/**
 * @template {ObjectKeyType} K
 * @template T
 * @template {ObjectKeyType} L
 * @param {Record<K, T>} object
 * @param {(k: K) => L} mapFunction
 * @returns {Record<L, T>}
 */
export function mapKeys(object, mapFunction) {
  return mapObject(object, (key, value) => [mapFunction(key), value])
}

/**
 * @template {ObjectKeyType} K
 * @template T
 * @param {Partial<Record<K, T>>} object
 * @param {(k: K) => boolean} filterFunc
 * @returns {Partial<Record<K, T>>}
 */
export function filterKeys(object, filterFunc) {
  const ret = /** @type{Record<K, T>} */ ({})

  for (const [k, v] of /** @type{[k: K, t: T][]} */ (Object.entries(object))) {
    if (filterFunc(k)) {
      ret[k] = v
    }
  }

  return ret
}

/**
 * @template {ObjectKeyType} K
 * @template T
 * @param {Partial<Record<K, T>>} object
 * @param {(t: T) => boolean} filterFunc
 * @returns {Partial<Record<K, T>>}
 */
export function filterValues(object, filterFunc) {
  const ret = /** @type{Record<K, T>} */ ({})

  for (const [k, v] of /** @type{[k: K, t: T][]} */ (Object.entries(object))) {
    if (filterFunc(v)) {
      ret[k] = v
    }
  }

  return ret
}

/**
 * @template {ObjectKeyType} K
 * @template T
 * @param {Partial<Record<K, T>>} object
 * @param {(k: K, t: T) => boolean} filterFunc
 * @returns {Partial<Record<K, T>>}
 */
export function filterEntries(object, filterFunc) {
  const ret = /** @type{Record<K, T>} */ ({})

  for (const [k, v] of /** @type{[k: K, t: T][]} */ (Object.entries(object))) {
    if (filterFunc(k, v)) {
      ret[k] = v
    }
  }

  return ret
}

/**
 * @template {ObjectKeyType} K, T
 * @template {Record<K, T>} P
 * @param {Error | string} error
 * @param {P} [properties=undefined] Default is `undefined`
 * @returns {P & Error}
 */
export function makeError(error, properties) {
  if (typeof error === 'string') {
    error = new Error(error)
  }
  // @ts-expect-error
  if (!properties) return error

  return Object.assign(error, properties)
}

/**
 * @template T1, T2
 * @param {T1[]} l
 * @param {T2[]} r
 * @returns {[T1, T2][]}
 */
export function zip(l, r) {
  const maxLength = [l, r].reduce(
    (maxTillNow, array) => (array.length > maxTillNow ? array.length : maxTillNow),
    0,
  )

  const zipResult = /** @type {[T1, T2][]} */ ([])

  for (const i of range(0, maxLength)) {
    zipResult.push([l[i], r[i]])
  }

  return zipResult
}

/**
 * @template T
 * @param {T[]} bigArray
 * @param {T[]} smallArray
 * @param {(t: T) => T} keyMapper
 */
export function minus(bigArray = [], smallArray = [], keyMapper = (x) => x) {
  return bigArray.filter((item) => !smallArray.map(keyMapper).includes(keyMapper(item)))
}

/**
 * @template T
 * @param {T[]} left
 * @param {T[]} right
 * @param {(t: T) => T} keyMapper
 */
export function diff(left = [], right = [], keyMapper = (x) => x) {
  const intersection = left.filter((item) => right.map(keyMapper).includes(keyMapper(item)))
  return minus(left.concat(right), intersection, keyMapper)
}

/**
 * @template {object} T
 * @template {keyof T} K
 * @param {T} object
 * @param {K[]} objectKeys
 * @returns {Pick<T, K>}
 */
export function pick(object, objectKeys) {
  const ret = /** @type{Pick<T, K>} */ ({})

  for (const key of objectKeys) {
    if (!(key in object)) continue

    ret[key] = object[key]
  }

  return ret
}

/**
 * @template {object} T
 * @template {keyof T} K
 * @param {T | null | undefined} object
 * @param {K[]} objectKeys
 * @returns {Pick<T, K> | undefined | null}
 */
export function pickWithNull(object, objectKeys) {
  if (object === undefined) return undefined
  if (object === null) return null

  return pick(object, objectKeys)
}

/**
 * @template T
 * @param {T[]} array
 * @returns {NonNullable<T>[]}
 */
export function filterOutNullOrUndefined(array) {
  return /** @type {NonNullable<T>[]} */ (array.filter((x) => x != null))
}

/**
 * @template T
 * @param {T[]} array
 * @param {number} chunkSize
 * @returns {T[][]}
 */
export function chunk(array, chunkSize) {
  const arrayLength = array.length
  /** @type {T[][]} */
  const ret = []
  let indexInChunk = chunkSize

  for (let i = 0; i < arrayLength; ++i) {
    if (indexInChunk === chunkSize) {
      ret.push([])
      indexInChunk = 0
    }
    ret[ret.length - 1][indexInChunk] = array[i]

    ++indexInChunk
  }

  return ret
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function clone(value) {
  if (typeof value === 'object') {
    if (value == null) {
      return value
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        return value
      } else {
        //@ts-expect-error
        return value.map(clone)
      }
    } else if (value.constructor?.name === 'Date') {
      // @ts-expect-error
      return new Date(value.getTime())
    } else {
      const ret = Object.create(Object.getPrototypeOf(value))

      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          ret[key] = clone(value[key])
        }
      }

      return ret
    }
  } else {
    return value
  }
}

/**
 * @param {number} base
 * @param {number} delta
 * @returns {number}
 */
export function valueWithAbsoluteJitterAfter(base, delta) {
  return base + Math.random() * delta
}

/**
 * @param {number} base
 * @param {number} percentageDelta
 * @returns {number}
 */
export function valueWithPercentageJitterAround(base, percentageDelta) {
  const maxDelta = (base * percentageDelta) / 100
  const delta = Math.random() * maxDelta

  return base - maxDelta / 2 + delta
}

/**
 * @template {Record<ObjectKeyType, any>} T
 * @param {T[]} collection
 * @param {keyof T | (keyof T)[]} keyOrKeys
 * @returns {T[]}
 */
export function uniqueBy(collection, keyOrKeys) {
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]
  const existingKeys = new Set()
  const result = []

  for (const entry of collection) {
    const keyValues = keys.map((k) => entry[k])
    const hasAllIds = keyValues.every((kv) => kv !== undefined)

    if (!hasAllIds) continue

    const serializedKeyValues = JSON.stringify(keyValues)

    if (!existingKeys.has(serializedKeyValues)) {
      existingKeys.add(serializedKeyValues)
      result.push(entry)
    }
  }
  return result
}

/**
 * A wrapper around a try/catch clause
 *
 * @template T
 * @param {() => T} f
 * @returns {[error: Error, result: undefined] | [error: undefined, result: T]}
 */
export function sresult(f) {
  try {
    return [undefined, f()]
  } catch (error) {
    return [/** @type {Error} */ (error), undefined]
  }
}

/**
 * @template T
 * @template {keyof T} K
 * @param {K} prop
 * @param {T[]} list
 * @returns {Map<string, T>}
 */
export function createMapBy(prop, list) {
  return list.reduce(function (resultMap, item) {
    const key = item[prop]

    resultMap.set(key, item)

    return resultMap
  }, new Map())
}

/**
 * @template T
 * @param {T[]} array
 * @param {(arg0: T) => boolean} predicate
 * @returns {[T[], T[]]}
 */
export function partitionByPredicate(array, predicate) {
  return array.reduce((result, element) => {
    result[predicate(element) ? 0 : 1].push(element)
    return result
  }, /** @type {[T[], T[]]} */ ([[], []]))
}

/**
 * @param {number[]} numbers
 * @returns {number}
 */
export function average(numbers) {
  return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
}

/**
 * @param {number} number
 * @param {number} low
 * @param {number} high
 */
export function isBetween(number, low, high) {
  return low < number && number < high
}

/**
 * @param {number} number
 * @param {number} low
 * @param {number} high
 */
export function isBetweenIncludingBorders(number, low, high) {
  return low <= number && number <= high
}

/**
 * /**
 *
 * @template T1
 * @template T2
 * @template {keyof T1 & keyof T2} K
 * @param {K} property
 * @param {T1[]} array1
 * @param {T2[]} array2
 * @returns {any[]}
 */
export function joinBy(property, array1, array2) {
  const array2Map = createMapBy(property, array2)
  return array1.map((entity) => ({...entity, ...array2Map.get(String(entity[property]))}))
}
