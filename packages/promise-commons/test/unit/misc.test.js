import mocha from 'mocha'
const {describe, it} = mocha
import chai from 'chai'
const {expect} = chai

import {
  failAfter,
  presult,
  unwrapPresult,
  delay,
  makeResolveablePromise,
  resolveResolveablePromise,
  rejectResolveablePromise,
  filterOutError,
  promiseAllSerial,
} from '../../src/promise-commons.js'

describe('functional-commons', function () {
  describe('failAfter', () => {
    it('should work', async () => {
      const start = Date.now()
      let end = Date.now()

      await failAfter(40, () => new Error('lalala')).catch((err) => {
        expect(err.message).to.equal('lalala')
        end = Date.now()
      })

      expect(end).to.not.be.undefined
      expect(end - start).to.be.greaterThan(39)
    })
  })

  describe('presult', () => {
    it('should return an error when the promise is rejected', async () => {
      const err = new Error('hi there')
      expect(await presult(Promise.reject(err))).to.eql([err, undefined])
    })

    it('should return the value as second array item when the promise is resolved', async () => {
      expect(await presult(Promise.resolve(42))).to.eql([undefined, 42])
    })
  })
  describe('unwrapPresult', () => {
    it('should unwrap a resolved presult to the original value', async () => {
      expect(await unwrapPresult(presult(delay(1).then(() => 42)))).to.equal(42)
    })

    it('should unwrap a rejected presult to the original value', async () => {
      expect(
        await unwrapPresult(presult(delay(1).then(() => Promise.reject(new Error('Ouch'))))).catch(
          (err) => err,
        ),
      ).to.be.instanceOf(Error)
    })
  })

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now()

      expect(await delay(100)).to.be.undefined

      expect(Date.now() - start).to.be.gte(100)
    })
  })

  describe('makeResolveablePromise', () => {
    it('should resolve a promise externally', async () => {
      const promise = makeResolveablePromise()

      delay(10).then(() => resolveResolveablePromise(promise, 42))

      expect(await promise).to.equal(42)
    })

    it('should reject a promise externally', async () => {
      const promise = makeResolveablePromise()

      delay(10).then(() => rejectResolveablePromise(promise, new Error('oh')))

      expect(await presult(promise)).to.satisfy(
        /** @param {[Error]} err */ ([err]) => expect(err.message).to.equal('oh'),
      )
    })
  })

  describe('filterOutError', () => {
    it('should filter out a specific error', async () => {
      const result = await filterOutError(
        Promise.resolve().then(() => Promise.reject(new Error('2'))),
        (error) => error.message === '2',
        (e) => Promise.resolve(e.message),
      )
      expect(result).to.equal('2')
    })

    it('should not filter out other errors', async () => {
      const result = await presult(
        filterOutError(
          Promise.resolve().then(() => Promise.reject(new Error('not!'))),
          (error) => error.message === 'ooo',
          () => Promise.resolve(2),
        ),
      )
      expect(result[0].message).to.equal('not!')
    })
  })

  describe('promiseAllSerial', () => {
    it('should return an empty array when given one', async () => {
      expect(await promiseAllSerial([])).to.eql([])
    })

    it('should return an array of results', async () => {
      expect(
        await promiseAllSerial([1, 2, 3, 4, 5].map((i) => () => Promise.resolve(i * 2))),
      ).to.eql([2, 4, 6, 8, 10])
    })

    it('runs serially', async () => {
      const results = /** @type {number[]} */ ([])

      await promiseAllSerial(
        [1, 2, 3, 4, 5].map((i) => () => delay(5 - i).then(() => results.push(i * 2))),
      )

      expect(results).to.eql([2, 4, 6, 8, 10])
    })

    it('should throw exception if one throws exception', async () => {
      expect(
        (
          await presult(
            promiseAllSerial(
              [1, 2, 3, 4, 5].map(
                (i) => () => i === 3 ? Promise.reject(new Error('oops')) : Promise.resolve(i * 2),
              ),
            ),
          )
        )[0].message,
      ).to.eql('oops')
    })
  })
})
