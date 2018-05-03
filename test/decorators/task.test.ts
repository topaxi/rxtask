import { Observable } from 'rxjs/Observable'
import { of } from 'rxjs/observable/of'
import { task, Task } from '../../src/task'
import { TaskDecorator } from '../../src/decorators/task'
import { marbles } from 'rxjs-marbles'
import { expect } from 'chai'
import { mock, stub } from 'sinon'
import { o } from '../test-helpers'

/** @test {TaskDecorator} */
describe('TaskDecorator', () => {
  describe('Teardown', () => {
    it('installs a teardown hook', () => {
      class Component {
        @TaskDecorator({ teardownMethod: 'destroy' })
        save = task((model: any) => of(model))
      }

      const c: any = new Component()
      c.save.subscribe()
      expect(c.destroy).to.be.a('function')
      c.destroy()
      expect(c.save.closed).to.be.true
    })

    it('installs teardown logic with existing teardown hook', () => {
      const tearedDown = stub()

      class Component {
        @TaskDecorator({ teardownMethod: 'teardown' })
        save = task((model: any) => of(model))

        teardown() {
          tearedDown(this)
        }
      }

      const c: any = new Component()
      c.save.subscribe()
      expect(c.teardown).to.be.a('function')
      c.teardown()
      expect(c.save.closed).to.be.true
      expect(tearedDown).to.have.been.calledWith(c)
    })

    it('installs teardown logic on subclasses', () => {
      const tearedDownBase = stub()
      const tearedDownSub = stub()

      class BaseComponent {
        @TaskDecorator({ teardownMethod: 'teardown' })
        fetch = task((id: number) => of({ id }))

        teardown() {
          tearedDownBase(this)
        }
      }

      class SubComponent extends BaseComponent {
        @TaskDecorator({ teardownMethod: 'teardown' })
        save = task((model: any) => of(model))

        teardown() {
          super.teardown()
          tearedDownSub(this)
        }
      }

      const c: any = new SubComponent()
      c.save.subscribe()
      expect(c.teardown).to.be.a('function')
      c.teardown()
      expect(c.save.closed).to.be.true
      expect(tearedDownBase).to.have.been.calledWith(c)
      expect(tearedDownSub).to.have.been.calledWith(c)
    })

    it('installs teardown logic only once', () => {
      class BaseComponent {
        @TaskDecorator({ teardownMethod: 'teardown' })
        fetch = task((id: number) => of({ id }))
      }

      class Component extends BaseComponent {
        @TaskDecorator({ teardownMethod: 'teardown' })
        save = task((model: any) => of(model))

        @TaskDecorator({ teardownMethod: 'teardown' })
        destroy = task((model: any) => of(true))

        teardown() {}
      }

      const c = new Component()
      expect(() => ((c as any).teardown = true)).to.throw(TypeError)
      expect(() =>
        Object.defineProperty(c, 'teardown', {
          configurable: true,
          writable: true,
          value: null,
        }),
      ).to.throw(TypeError)
      expect(c.teardown).to.be.a('function')
    })
  })

  describe('Property Decorator', () => {
    it(
      'immediately subscribes to task',
      marbles(m => {
        let t = task((model: any) => of(model))
        let tmock = mock(t)
        tmock
          .expects('subscribeUntil')
          .once()
          .returns(t)

        class Component {
          @TaskDecorator({ teardownMethod: 'onDestroy' })
          save = t
        }

        let c = new Component()
        tmock.verify()
        expect(c.save).to.equal(t)
        expect(c.save.perform).to.be.a('function')
        m.expect(o(c.save.perform('a'))).toBeObservable('(a|)')
      }),
    )
  })

  describe('Method Decorator', () => {
    it(
      'wraps a method',
      marbles(m => {
        class Component {
          @TaskDecorator({ teardownMethod: 'onDestroy' })
          task(model: any): Observable<this> {
            return of(this)
          }
        }

        let c = new Component()
        expect(c.task).to.be.a('function')
        expect(c.task).to.be.instanceof(Task)
        expect((c.task as any).perform).to.be.a('function')
        m.expect(c.task(null)).toBeObservable('(a|)', { a: c })
      }),
    )
  })
})
