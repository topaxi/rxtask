import * as index from '../src'
import { expect } from 'chai'

/** @ignore */
describe('index', () => {
  it('exports Task', () => {
    expect(index.Task).to.exist
    expect(index.task).to.exist
  })

  it('exports TaskInstance', () => {
    expect(index.TaskInstance).to.exist
  })
})
