'use strict'
import mocha from 'mocha'
const {describe, it} = mocha
import chai from 'chai'
const {expect} = chai
import {
  range,
  sum,
  throw_,
  mapObject,
  mapValues,
  mapKeys,
  filterKeys,
  filterValues,
  filterEntries,
  makeError,
  zip,
  pick,
  minus,
  diff,
  group,
  filterOutNullOrUndefined,
  randomBetween,
  chunk,
  clone,
  valueWithAbsoluteJitterAfter,
  valueWithPercentageJitterAround,
  uniqueBy,
  pickWithNull,
  sresult,
  createMapBy,
  average,
  isBetween,
  isBetweenIncludingBorders,
  joinBy,
} from '../../src/functional-commons.js'

describe('functional-commons [misc] (unit)', function () {
  describe('range', () => {
    it('should return an empty array if from === to', () => {
      expect(range(4, 4)).to.eql([])
    })
    it('should return an empty array if from > to', () => {
      expect(range(5, 4)).to.eql([])
    })
    it('should return the numbers if from < to', () => {
      expect(range(4, 7)).to.eql([4, 5, 6])
      expect(range(0, 4)).to.eql([0, 1, 2, 3])
    })
    it('should step correctly', () => {
      expect(range(4, 8, 2)).to.eql([4, 6])
      expect(range(0, 13, 3)).to.eql([0, 3, 6, 9, 12])
      expect(range(7, 8, 3)).to.eql([7])
    })
  })

  describe('sum', () => {
    it('should return 0 for an empty array', () => {
      expect(sum([])).to.equal(0)
    })
    it('should return number for a 1-length array', () => {
      expect(sum([42])).to.equal(42)
    })
    it('should return sum for an array', () => {
      expect(sum([7, 9, 0, -1, 3])).to.equal(18)
    })
  })

  describe('throw_', () => {
    it('should throw an error', async () => {
      let value
      const thrownErr = new Error('hi')
      try {
        value = throw_(thrownErr)
      } catch (err) {
        expect(value).to.be.undefined
        expect(err).to.equal(thrownErr)
      }
    })
  })

  describe('mapObject', () => {
    it('should work with identity', () => {
      expect(mapObject({a: 1, b: 2}, (key, value) => [key, value])).to.eql({a: 1, b: 2})
    })

    it('should map keys', () => {
      expect(mapObject({a: 1, b: 2}, (key, value) => [key + '1', value])).to.eql({a1: 1, b1: 2})
    })

    it('should map values', () => {
      expect(mapObject({a: 1, b: 2}, (key, value) => [key, value + 1])).to.eql({a: 2, b: 3})
    })

    it('should map both', () => {
      expect(mapObject({a: 1, b: 2}, (key, value) => [key + '1', value + 1])).to.eql({a1: 2, b1: 3})
    })
  })

  describe('mapValues', () => {
    it('should work with identity', () => {
      expect(mapValues({a: 1, b: 2}, (value) => value)).to.eql({a: 1, b: 2})
    })

    it('should map values', () => {
      expect(mapValues({a: 1, b: 2}, (value) => value + 1)).to.eql({a: 2, b: 3})
    })
  })

  describe('mapKeys', () => {
    it('should work with identity', () => {
      expect(mapKeys({a: 1, b: 2}, (value) => value)).to.eql({a: 1, b: 2})
    })

    it('should map keys', () => {
      expect(mapKeys({a: 1, b: 2}, (value) => value + 'x')).to.eql({ax: 1, bx: 2})
    })
  })

  describe('makeError', () => {
    it('should create an Error if passed a string', async () => {
      const err = makeError('foo')

      expect(err).to.be.instanceof(Error)
      expect(err.message).to.equal('foo')
    })

    it('should set propties of error according to properties parameter', async () => {
      const err = makeError('lalala', {code: 4, lode: 5})

      expect(err).to.be.instanceof(Error)
      expect(err.message).to.equal('lalala')
      expect(err.code).to.equal(4)
      expect(err.lode).to.equal(5)
    })
  })

  describe('zip', () => {
    it('should return zip with two arrays of equal length', () => {
      expect(zip([1, 2, 3], [4, 5, 6])).to.eql([
        [1, 4],
        [2, 5],
        [3, 6],
      ])
    })

    it('should return zip with two arrays of unequal length', () => {
      expect(zip([1, 2, 3], [4, 5])).to.eql([
        [1, 4],
        [2, 5],
        [3, undefined],
      ])
      expect(zip([1, 2], [3, 4, 5])).to.eql([
        [1, 3],
        [2, 4],
        [undefined, 5],
      ])
    })
  })

  describe('minus', () => {
    it('should return the difference between two arrays', () => {
      expect(minus(['a', 'b'], ['b'])).to.eql(['a'])
    })
    it('should return an empty array if they are the same', () => {
      expect(minus(['a', 'b'], ['a', 'b'])).to.eql([])
    })
    it('should return the first array if the second is empty', () => {
      expect(minus(['a', 'b'])).to.eql(['a', 'b'])
    })
    it('should return an empty array if the first is empty', () => {
      expect(minus([], ['a', 'b'])).to.eql([])
    })
  })

  describe('diff', () => {
    it('should return the difference between two arrays', () => {
      expect(diff(['a', 'b'], ['b'])).to.eql(['a'])
      expect(diff(['b'], ['a', 'b'])).to.eql(['a'])
    })
    it('should return the first array if the second is empty', () => {
      expect(diff(['a', 'b'])).to.eql(['a', 'b'])
    })
    it('should return the second array if the first is empty', () => {
      expect(diff([], ['a', 'b'])).to.eql(['a', 'b'])
    })
    it('should return an empty array if they are the same', () => {
      expect(diff(['a', 'b'], ['a', 'b'])).to.eql([])
    })
  })

  describe('filterMap functions', () => {
    it('filterKeys should filter keys', () => {
      expect(filterKeys({a: 4, b: 5, c: 6}, (k) => k === 'a' || k === 'c')).to.eql({a: 4, c: 6})
    })
    it('filterValues should filter values', () => {
      expect(filterValues({a: 4, b: 5, c: 6}, (v) => v === 4 || v === 5)).to.eql({a: 4, b: 5})
    })
    it('filterEntries should filter entries', () => {
      expect(filterEntries({a: 4, b: 5, c: 6}, (k, v) => k === 'a' && v === 4)).to.eql({a: 4})
    })
    it('filterKeys: key type of result should be Partial', () => {
      /** @type {{optional?: number; required: number}} */
      const object = {optional: 1, required: 2}

      expect(filterKeys(object, (k) => k !== 'optional')).to.eql({required: 2})
    })
    it('filterValues: key type of result should be Partial', () => {
      /** @type {{optional?: number; required: number}} */
      const object = {optional: 1, required: 2}

      expect(filterValues(object, (v) => v === 2)).to.eql({required: 2})
    })
    it('filterEntries: key type of result should be Partial', () => {
      /** @type {{optional?: number; required: number}} */
      const object = {optional: 1, required: 2}

      expect(filterEntries(object, (k, v) => k === 'required' && v === 2)).to.eql({required: 2})
    })
  })

  describe('pick', () => {
    it('should return empty object if no objectKeys', () => {
      expect(pick({a: 4, b: 5}, [])).to.eql({})
    })

    it('should return filtered object on one entry in objectKeys', () => {
      expect(pick({a: 4, b: 5}, ['b'])).to.eql({b: 5})
    })

    it('should return filtered object on two entries in objectKeys', () => {
      expect(pick({a: 4, b: 5, c: 6}, ['b', 'a'])).to.eql({b: 5, a: 4})
    })

    it('should deal with objectKeys with non-existing key', () => {
      //@ts-expect-error
      expect(pick({a: 4, b: 5, c: 6}, ['b', 'd'])).to.eql({b: 5})
    })

    it('should deal correctly with undefined', () => {
      expect(pick({a: 4, b: undefined, c: 6}, ['b'])).to.eql({b: undefined})
    })

    it('should deal with empty object', () => {
      //@ts-expect-error
      expect(pick({}, ['b'])).to.eql({})
    })

    it('pick should now allow udndefined and null in type signature (and should throw in runtime)', () => {
      //@ts-expect-error
      expect(pick(undefined, [])).to.eql({})
    })

    it('pickWithNull should allow undefined and null', () => {
      expect(pickWithNull(undefined, [])).to.eql(undefined)
      expect(pickWithNull(null, [])).to.eql(null)
      expect(pickWithNull({a: 4, b: 5}, ['b'])).to.eql({b: 5})
    })

    it('pickWithNull should allow returning undefined and null in type signature', () => {
      const x = pickWithNull({a: 4, b: 5}, ['b'])
      //@ts-expect-error
      expect(x.b).to.eql(5)
    })

    it('pickWithNull should allow returning undefined and null in type signature', () => {
      const x = pickWithNull(undefined, [])
      //@ts-expect-error
      expect(() => x.b).to.throw()
    })
  })

  describe('group', () => {
    it('group will return an array as an object grouped by the prop requested', () => {
      const items = [
        {type: 'a', value: 120},
        {type: 'a', value: 140},
        {type: 'a', value: 1},
        {type: 'b', value: 4},
        {type: 'b', value: 3},
        {type: 'c', value: 1},
        {type: 'c', value: 2},
        {type: 'z', value: 55},
      ]

      const grouped = group('type', items)

      // This checks that the type signature of `grouped` is correct
      expect(grouped['a'][0].value).to.equal(120)

      expect(grouped).to.deep.equal({
        a: [
          {type: 'a', value: 120},
          {type: 'a', value: 140},
          {type: 'a', value: 1},
        ],
        b: [
          {type: 'b', value: 4},
          {type: 'b', value: 3},
        ],
        c: [
          {type: 'c', value: 1},
          {type: 'c', value: 2},
        ],
        z: [{type: 'z', value: 55}],
      })
    })

    it('group will return an undefined group when grouped by a prop that is not there', () => {
      const items = [
        {type: 'a', value: 120},
        {type: 'a', value: 140},
        {type: 'a', value: 1},
        {type: 'b', value: 4},
        {type: 'b', value: 3},
        {type: 'c', value: 1},
        {type: 'c', value: 2},
        {type: 'z', value: 55},
      ]

      //@ts-expect-error
      const grouped = group('foo', items)
      expect(grouped).to.deep.equal({
        undefined: items,
      })
    })

    it('group will return an empty object on an empty array', () => {
      expect(group('foo', [])).to.eql({})
    })
  })

  describe('filterOutNullOrUndefined', () => {
    it('should filter out null or undefined', () => {
      expect(filterOutNullOrUndefined([1, 2, 0, null, 3, undefined, 4])).to.eql([1, 2, 0, 3, 4])
    })
    it('should not filter anything if no null or undefined', () => {
      expect(filterOutNullOrUndefined([1, 2, 4])).to.eql([1, 2, 4])
    })

    it('should return empty array if all are null or undefined', () => {
      expect(filterOutNullOrUndefined([null, undefined])).to.eql([])
    })

    it('should return empty array if got empty array', () => {
      expect(filterOutNullOrUndefined([])).to.eql([])
    })

    it('should pass TS check', () => {
      /** @type {({p: number} | undefined | null)[]} */
      const array = [{p: 1}, undefined, {p: 2}, null]

      // If the TS return type is defined incorrectly, then the map would fail typechecking
      // because `x` would have also been `null` or `undefined`, which would mean `x.p`
      // does not pass typechecking
      expect(filterOutNullOrUndefined(array).map((x) => x.p)).to.eql([1, 2])
    })
  })

  describe('randomBetween', () => {
    it('should return a number between 3 to 5', () => {
      for (const _ of range(0, 100000)) {
        expect(randomBetween(3, 5)).to.be.gte(3).and.be.lt(5)
      }
    })

    it('should return a number between 0 to 5', () => {
      for (const _ of range(0, 100000)) {
        expect(randomBetween(3, 5)).to.be.gte(0).and.be.lt(10)
      }
    })
  })

  describe('chunk', () => {
    it('should return empty array on empty array', () => {
      expect(chunk([], 10)).to.eql([])
    })

    it('should return same array if array length is 1', () => {
      expect(chunk([1, 2, 3], 10)).to.eql([[1, 2, 3]])
    })

    it('should return same array if array length is 1', () => {
      expect(chunk([2], 10)).to.eql([[2]])
    })

    it('should return size-1 arrays if chunk size is 1', () => {
      expect(chunk([1, 2, 3], 1)).to.eql([[1], [2], [3]])
    })

    it('should return same array if chunk size is 0', () => {
      expect(chunk([1, 2, 3], 0)).to.eql([[1, 2, 3]])
    })

    it('should return empty array if chunk size is 0 and empty array', () => {
      expect(chunk([], 0)).to.eql([])
    })

    it('should return same array if chunk size is equal to array length', () => {
      expect(chunk([1, 2, 3], 3)).to.eql([[1, 2, 3]])
    })

    it('should return multiple arrays if chunk size is a multiple of array length', () => {
      expect(chunk(range(1, 10), 3)).to.eql([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
    })

    it('should return have a smaller tail if chunk size is a not a multiple of array length', () => {
      expect(chunk(range(1, 9), 3)).to.eql([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8],
      ])
    })
  })

  describe('clone', () => {
    it('should "clone" a primitive', () => {
      expect(clone(4)).to.equal(4)
      expect(clone('4')).to.equal('4')
      expect(clone(4n)).to.equal(4n)
      expect(new Date(4000)).to.eql(new Date(4000))
      const s = Symbol()
      expect(clone(s)).to.equal(s)
      expect(clone(null)).to.equal(null)
      expect(clone(undefined)).to.equal(undefined)
      const f = () => 1
      expect(clone(f)).to.equal(f)
      expect(clone(true)).to.equal(true)
      expect(clone(false)).to.equal(false)
    })

    it('should clone an array', () => {
      const array = [undefined, 4, 'sdfsdf', true]

      expect(clone(array)).to.eql(array)
    })

    it('should clone an empty array', () => {
      expect(clone([])).to.eql([])
    })

    it('should clone an object', () => {
      const object = {
        a: '4',
        b: 5,
        c: ['a', 'b', 'c'],
      }
      expect(clone(object)).to.eql(object)
    })

    it('should clone an object, without the prototype members', () => {
      const prototype = Object.create({
        a: '4',
        b: 5,
      })
      const object = Object.create(prototype)
      object.c = ['a', 'b', 'c']

      expect(clone(object)).to.eql(object)
      expect(clone(object).hasOwnProperty('a')).to.equal(false)
      expect(clone(object).hasOwnProperty('b')).to.equal(false)
    })

    it('should clone an object with no prototype', () => {
      const object = Object.create(null)
      object.c = ['a', 'b', 'c']

      expect(clone(object)).to.eql(object)
    })

    it('all together now', () => {
      const object = [
        {
          a: 4,
          b: {a: 5, c: [5, 'gil', 'tayar', {eee: 4n, ddd: true, fff: undefined}]},
          c: null,
        },
      ]
      expect(clone(object)).to.eql(object)
    })
  })

  describe('uniqueBy', () => {
    it('should get unique value by id', () => {
      const collection = [{id: 1}, {id: 2}, {id: 3}, {id: 1}, {id: 2}]
      const uniqueCollection = uniqueBy(collection, 'id')

      expect(uniqueCollection).to.have.lengthOf(3)
      expect([...new Set(collection.map((item) => item.id))])
        .to.have.lengthOf(uniqueCollection.length)
        .and.to.have.members([1, 2, 3])
    })
    it('should get unique value by id (multiple)', () => {
      const collection = [
        {id: 1, x: 1, z: 2},
        {id: 2, x: 4},
        {id: 3, x: 9},
        {id: 1, x: 1, z: 3},
        {id: 2, x: 2},
        {id: 5, x: 1},
      ]
      const uniqueCollection = uniqueBy(collection, ['id', 'x'])

      expect(uniqueCollection).to.eql([
        {id: 1, x: 1, z: 2},
        {id: 2, x: 4},
        {id: 3, x: 9},
        {id: 2, x: 2},
        {id: 5, x: 1},
      ])
    })

    it('should filter items with missing key', () => {
      const collection = [{id: 1}, {notId: 2}]
      const uniqueCollection = uniqueBy(collection, 'id')

      expect(uniqueCollection).to.eql([{id: 1}])
    })

    it('should filter items with missing key (multiple)', () => {
      const collection = [
        {id: 1, x: 1, z: 2},
        {id: 2, x: 4},
        {id: 3},
        {id: 1, x: 1, z: 3},
        {id: 2, x: 2},
        {id: 5, x: 1},
      ]
      const uniqueCollection = uniqueBy(collection, ['id', 'x'])

      expect(uniqueCollection).to.eql([
        {id: 1, x: 1, z: 2},
        {id: 2, x: 4},
        {id: 2, x: 2},
        {id: 5, x: 1},
      ])
    })

    it('should handle empty array', () => {
      expect(uniqueBy([], 'id')).to.eql([])
      expect(uniqueBy([], ['id', 'x'])).to.eql([])
    })
  })

  describe('jitter', () => {
    it('valueWithAbsoluteJitterAfter: should return value in correct range', () => {
      const result = range(1, 100000).map(() => valueWithAbsoluteJitterAfter(5, 20))
      expect([...new Set(result)].length).to.be.closeTo(result.length, 10)

      for (const value of result) {
        expect(value).to.be.above(5).and.to.be.below(25)
      }
    })

    it('valueWithPercentageJitterAround: should return value in correct range', () => {
      const result = range(1, 100000).map(() => valueWithPercentageJitterAround(100, 7))
      expect([...new Set(result)].length).to.be.closeTo(result.length, 10)

      for (const value of result) {
        expect(value)
          .to.be.above(100 - 3.5)
          .and.to.be.below(100 + 3.5)
      }
    })
  })
  describe('result', () => {
    it('should result a valid result', () => {
      const [err, result] = sresult(() => ({a: 1}))
      expect(result).to.have.property('a').and.to.eql(1)
      expect(err).to.be.undefined
    })

    it('should return an error object when an internal function throws', () => {
      const [err, result] = sresult(() => {
        throw new Error('I should be in the err object')
      })
      expect(result).to.be.undefined
      expect(err).to.be.instanceOf(Error)
      expect(err?.message).to.eql('I should be in the err object')
    })
  })
  describe('createMapBy', () => {
    it('createMapBy will return an object by prop requested', () => {
      const items = [
        {type: 'a', value: 120},
        {type: 'b', value: 4},
        {type: 'c', value: 1},
        {type: 'd', value: 2},
        {type: 'z', value: 55},
      ]

      const mapped = createMapBy('type', items)

      // This checks that the type signature of `mapped` is correct
      expect(mapped.get('a')?.value).to.equal(120)
      expect(mapped.get('a')?.type).to.equal('a')

      expect(Object.fromEntries(mapped)).to.deep.equal({
        a: {type: 'a', value: 120},
        b: {type: 'b', value: 4},
        c: {type: 'c', value: 1},
        d: {type: 'd', value: 2},
        z: {type: 'z', value: 55},
      })
    })

    it('createMapBy will return an undefined property with the last element in the array', () => {
      const items = [
        {type: 'a', value: 120},
        {type: 'b', value: 4},
        {type: 'c', value: 1},
        {type: 'd', value: 2},
        {type: 'z', value: 55},
      ]

      //@ts-expect-error
      const mapped = createMapBy('foo', items)
      expect(Object.fromEntries(mapped)).to.deep.equal({undefined: {type: 'z', value: 55}})
    })

    it('createMapBy will return an empty map on an empty array', () => {
      expect(Object.fromEntries(createMapBy('foo', []))).to.eql({})
    })

    it('createMapBy will create a map with unique keys only - with last element that matches a key', () => {
      const items = [
        {type: 'a', value: 120},
        {type: 'a', value: 4},
        {type: 'c', value: 1},
        {type: 'd', value: 2},
        {type: 'z', value: 55},
      ]

      const mapped = createMapBy('type', items)
      expect(Object.fromEntries(mapped)).to.deep.equal({
        a: {type: 'a', value: 4},
        c: {type: 'c', value: 1},
        d: {type: 'd', value: 2},
        z: {type: 'z', value: 55},
      })
    })
  })
  describe('average', () => {
    it('should calculate average', () => {
      expect(average([1, 2, 3, 4, 5])).to.eql(3)
      expect(average([-100, 50, 0, 100, -50])).to.eql(0)
    })
    it('should return 0 for an empty array', () => {
      expect(average([])).to.eql(0)
    })
    it('should return number for a 1-length array', () => {
      expect(average([42])).to.eql(42)
    })
  })

  describe('isBetween', () => {
    it('should return true if number isBetween', () => {
      expect(isBetween(2, 1, 3)).to.be.true
      expect(isBetween(0, -1, 2)).to.be.true
      expect(isBetween(0, -0.1, 0.1)).to.be.true
    })
    it('should return false if number is not between', () => {
      expect(isBetween(1, 1, 3)).to.be.false
      expect(isBetween(1, 1, 3)).to.be.false
      expect(isBetween(42, 1, 3)).to.be.false
    })
  })

  describe('isBetweenIncludingBorders', () => {
    it('should return true if number isBetweenIncludingBorders', () => {
      expect(isBetweenIncludingBorders(2, 1, 3)).to.be.true
      expect(isBetweenIncludingBorders(0, -1, 2)).to.be.true
      expect(isBetweenIncludingBorders(0, -0.1, 0.1)).to.be.true
      expect(isBetweenIncludingBorders(1, 1, 3)).to.be.true
      expect(isBetweenIncludingBorders(1, 1, 3)).to.be.true
    })
    it('should return false if number is not betweenIncludingBorders', () => {
      expect(isBetweenIncludingBorders(42, 1, 3)).to.be.false
    })
  })
  describe('joinBy', () => {
    it('should join by property', () => {
      const arr1 = [
        {number: '0', double: 0},
        {number: '1', double: 2},
        {number: '2', double: 4},
        {number: '3', double: 6},
        {number: '4', double: 8},
      ]

      const arr2 = [
        {number: '0', quadruple: 0},
        {number: '1', quadruple: 4},
        {number: '2', quadruple: 8},
        {number: '3', quadruple: 12},
        {number: '4', quadruple: 16},
      ]

      const joinedArray = joinBy('number', arr1, arr2)
      expect(joinedArray).to.eql([
        {number: '0', double: 0, quadruple: 0},
        {number: '1', double: 2, quadruple: 4},
        {number: '2', double: 4, quadruple: 8},
        {number: '3', double: 6, quadruple: 12},
        {number: '4', double: 8, quadruple: 16},
      ])
    })

    it('should join by property and get only the properties exist in the first array', () => {
      const arr1 = [
        {number: '0', double: 0},
        {number: '3', double: 6},
        {number: '4', double: 8},
      ]

      const arr2 = [
        {number: '0', quadruple: 0},
        {number: '1', quadruple: 4},
        {number: '2', quadruple: 8},
        {number: '3', quadruple: 12},
        {number: '4', quadruple: 16},
      ]

      const joinedArray = joinBy('number', arr1, arr2)
      expect(joinedArray).to.eql([
        {number: '0', double: 0, quadruple: 0},
        {number: '3', double: 6, quadruple: 12},
        {number: '4', double: 8, quadruple: 16},
      ])
    })

    it('should join by property and get all properties exist in the first array', () => {
      const arr1 = [
        {number: '0', double: 0},
        {number: '1', double: 2},
        {number: '2', double: 4},
        {number: '3', double: 6},
        {number: '4', double: 8},
      ]

      const arr2 = [
        {number: '0', quadruple: 0},
        {number: '3', quadruple: 12},
        {number: '4', quadruple: 16},
      ]

      const joinedArray = joinBy('number', arr1, arr2)
      expect(joinedArray).to.eql([
        {number: '0', double: 0, quadruple: 0},
        {number: '1', double: 2},
        {number: '2', double: 4},
        {number: '3', double: 6, quadruple: 12},
        {number: '4', double: 8, quadruple: 16},
      ])
    })
  })
})
