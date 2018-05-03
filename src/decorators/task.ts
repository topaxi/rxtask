import { Subject } from 'rxjs/Subject'
import { Task } from '../task'

// istanbul ignore next
const destroyTasks$: symbol =
  typeof Symbol === 'function'
    ? (Symbol as any)('destroyTasks$')
    : '__destroyTasks$__'

export type TaskDecoratorOptions = {
  readonly teardownMethod: string
}

/**
 * @param {string} teardownMethodName
 * @return {Function}
 */
export function TaskDecorator(
  options: TaskDecoratorOptions,
): (target: any, propertyKey: string) => void
export function TaskDecorator(
  options: TaskDecoratorOptions,
): (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor | void
export function TaskDecorator({
  teardownMethod,
}: TaskDecoratorOptions): (
  target: any,
  propertyKey: string,
  descriptor?: PropertyDescriptor,
) => any {
  return (target, propertyKey, descriptor) => {
    if (descriptor === undefined) {
      descriptor = {
        configurable: true,
        set(task: Task<any, any>) {
          installTask(this, task, propertyKey, teardownMethod)
        },
      }
    } else {
      const method = target[propertyKey]

      descriptor = {
        enumerable: descriptor.enumerable,
        configurable: true,
        get(): Task<any, any> {
          return installTask(
            this,
            new Task(method.bind(this)).callable(),
            propertyKey,
            teardownMethod,
          )
        },
      }
    }

    Object.defineProperty(target, propertyKey, descriptor)
    return descriptor
  }
}

function installTask<T extends Task<any, any>>(
  instance: any,
  task: T,
  propertyKey: string,
  teardownMethod: string,
): T {
  if (instance[destroyTasks$] === undefined) {
    Object.defineProperty(instance, destroyTasks$ as any, {
      value: new Subject(),
    })
    Object.defineProperty(instance, teardownMethod, {
      value: function(): void {
        this[destroyTasks$].next()
        this[destroyTasks$].complete()

        const super_ = Object.getPrototypeOf(this)
        if (super_[teardownMethod] !== undefined) {
          super_[teardownMethod].apply(this, arguments)
        }
      },
    })
  }

  Object.defineProperty(instance, propertyKey, {
    value: task.subscribeUntil(instance[destroyTasks$]),
  })

  return task
}
