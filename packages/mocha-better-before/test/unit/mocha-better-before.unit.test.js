import chai from 'chai'
const {expect} = chai

import {before, after, describe, it, afterEach, beforeEach} from '../../src/mocha-better-before.js'

describe('mocha-better-before (unit)', function () {
  let count = 0
  let beforeCount = 0
  let beforeEachCount = 0
  beforeEach(() => {
    beforeCount = 0
    beforeEachCount = 0
  })
  const {a, b} = before(() => ({
    a: 4,
    b: {z: 5},
    count: ++count,
  }))
  before(() => {
    expect(++beforeCount).to.equal(1)
    expect(count).to.equal(1)
  })
  before(async () => expect(++beforeCount).to.equal(2))
  beforeEach(() => expect(++beforeEachCount).to.equal(1))
  beforeEach(async () => expect(++beforeEachCount).to.equal(2))
  const {c, d} = before(async () => {
    return {
      c: 4,
      d: {z: 5},
      count: ++count,
    }
  })
  before(() => expect(count).to.equal(2))

  let countAfter = 0
  let countAfterEach = 0

  after(() => {
    ++countAfter
  })

  afterEach(() => {
    ++countAfterEach
  })

  after(() => {
    expect(countAfter).to.equal(1)
    expect(countAfterEach).to.equal(2)
  })

  expect(() => c()).to.throw(/trying to access property c/)

  it('should work with sync before', async () => {
    expect(count).to.equal(2)
    expect(a()).to.equal(4)
    expect(b().z).to.equal(5)
  })

  it('should work with async before', async () => {
    expect(count).to.equal(2)
    expect(c()).to.equal(4)
    expect(d().z).to.equal(5)
  })
})
