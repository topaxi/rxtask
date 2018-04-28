import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'
import { configure } from 'rxjs-marbles'
import { Task, TaskInstance } from '../src'

const mochaUtils = require('mocha/lib/utils')

const canonicalize = mochaUtils.canonicalize
mochaUtils.canonicalize = function(value: any, stack: any, typeHint: string) {
  if (value instanceof Task || value instanceof TaskInstance) {
    return canonicalize(value.toString(), stack, 'string')
  }

  return canonicalize(value, stack, typeHint)
}

configure({
  assert: (value, message) => chai.expect(value, message).to.be.true,
  assertDeepEqual: (actual, expected) =>
    chai.expect(actual).to.deep.equal(expected),
  frameworkMatcher: true,
})

chai.use(sinonChai)
