import { EMPTY_ARRAY } from '../../src/utils/empty-array'
import { expect } from 'chai'

/** @test {EMPTY_ARRAY} */
describe('utils/empty-array', () => {
  it('is an empty readonly array', () => {
    expect(EMPTY_ARRAY).to.be.a('array')
    expect(EMPTY_ARRAY).to.have.lengthOf(0)
    expect(EMPTY_ARRAY).to.be.frozen
    expect(() => (EMPTY_ARRAY as any).push(0)).to.throw(TypeError)
  })
})
