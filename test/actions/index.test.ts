import { createAction, toAction } from '../../src/actions'
import * as index from '../../src/actions/index'
import { expect } from 'chai'

/** @ignore */
describe('actions/index', () => {
  it('exports createAction', () => {
    expect(index.createAction).to.exist
  })

  it('exports toAction', () => {
    expect(index.toAction).to.exist
  })
})

/** @test {createAction} */
describe('createAction', () => {
  it('creates action', () => {
    expect(createAction('TEST_ACTION')).to.deep.equal({ type: 'TEST_ACTION' })
    expect(createAction('TEST_ACTION')).to.not.have.property('payload')
  })

  it('creates action with payload', () => {
    expect(createAction('TEST_ACTION', 'PAYLOAD')).to.deep.equal({
      type: 'TEST_ACTION',
      payload: 'PAYLOAD',
    })
    expect(createAction('TEST_ACTION', undefined)).to.deep.equal({
      type: 'TEST_ACTION',
      payload: undefined,
    })
    expect(createAction('TEST_ACTION', undefined)).to.have.property('payload')
    expect(createAction('TEST_ACTION', [])).to.deep.equal({
      type: 'TEST_ACTION',
      payload: [],
    })
  })
})

/** @test {toAction} */
describe('toAction', () => {
  it('creates a function to create actions with payload', () => {
    expect(toAction('TEST_ACTION')('PAYLOAD')).to.deep.equal({
      type: 'TEST_ACTION',
      payload: 'PAYLOAD',
    })
    expect(toAction('TEST_ACTION')(undefined)).to.deep.equal({
      type: 'TEST_ACTION',
      payload: undefined,
    })
    expect(toAction('TEST_ACTION')(undefined)).to.have.property('payload')
  })
})
