import * as index from '../../src/utils'
import { expect } from 'chai'

/** @ignore */
describe('utils/index', () => {
  it('exports EMPTY_ARRAY', () => {
    expect(index.EMPTY_ARRAY).to.exist
  })

  it('exports assertNever', () => {
    expect(index.assertNever).to.exist
  })

  it('exports neq', () => {
    expect(index.neq).to.exist
  })

  it('exports notNull', () => {
    expect(index.notNull).to.exist
  })

  it('exports createCallableObject', () => {
    expect(index.createCallableObject).to.exist
  })

  it('exports pipe', () => {
    expect(index.pipe).to.exist
  })
})
