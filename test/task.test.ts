import { of } from 'rxjs/observable/of'
import { Subject } from 'rxjs/Subject'
import { task } from '../src/task'
import { TaskInstance } from '../src/task-instance';
import { expect } from 'chai'
import { stub } from 'sinon'
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError';

/** @test {Task} */
describe('Task', () => {
  let destroy$: Subject<void>;
  beforeEach(() => {
    destroy$ = new Subject()
  })
  afterEach(() => {
    destroy$.next()
  })

  /** @test {Task#perform} */
  describe('perform', () => {
    it('executes the given function and creates a TaskInstance', () => {
      const fn = stub().returns(of(true))
      const t = task(fn).subscribeUntil(destroy$)

      const i = t.perform('task')

      expect(i).to.be.instanceOf(TaskInstance)
      expect(fn).to.be.calledWith('task')

      t.perform('second task')

      expect(fn).to.be.calledWith('second task')
    })
  })

  /** @test {Task#unsubscribe} */
  describe('unsubscribe', () => {
    it('closes the Task', () => {
      const fn = stub()
      const t = task(fn).subscribeUntil(destroy$)

      t.unsubscribe()

      expect(t.closed).to.be.true
      expect(() => t.subscribe()).to.throw(ObjectUnsubscribedError)
      expect(() => t.perform(null)).to.throw(ObjectUnsubscribedError)
      expect(fn).to.not.be.called
    })
  })

  /** @test {Task#callable} */
  describe('callable', () => {
    it('creates a callable task object', () => {
      const fn = stub().returns(of(true))
      const t = task(fn).callable().subscribeUntil(destroy$)

      const i = t('callable task')

      expect(i).to.be.instanceOf(TaskInstance)
      expect(fn).to.be.calledWith('callable task')
    })
  })
})
