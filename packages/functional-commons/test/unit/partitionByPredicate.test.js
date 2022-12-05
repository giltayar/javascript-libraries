import mocha from 'mocha'
const {describe, it} = mocha
import chai from 'chai'
const {expect} = chai

import {partitionByPredicate, range} from '../../src/functional-commons.js'

describe('functional-commons [misc] (unit)', function () {
  describe('range', () => {
    it('should partition numbers to even and odd', () => {
      const evenNumbers = range(-10, 10, 2)
      const oddNumbers = range(-11, 11, 2)
      expect(partitionByPredicate(evenNumbers.concat(oddNumbers), (x) => x % 2 == 0)).to.eql([
        evenNumbers,
        oddNumbers,
      ])
    })

    it('should partition strings by length', () => {
      const shortStrings = ['t', 'te', 'tes', 'test']
      const longStrings = ['test-', 'test-t', 'test-te', 'test-tes', 'test-test']

      expect(partitionByPredicate(shortStrings.concat(longStrings), (x) => x.length < 5)).to.eql([
        shortStrings,
        longStrings,
      ])
    })

    it('should partition an empty array', () => {
      expect(partitionByPredicate([], (x) => x % 2 == 0)).to.eql([[], []])
    })
  })
})
