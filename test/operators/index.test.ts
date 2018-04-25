import * as index from '../../src/operators/index'
import { expect } from 'chai'

/** @ignore */
describe('operators/index', () => {
  it('exports actionReducer', () => {
    expect(index.actionReducer).to.exist
  })
})
