import { TaskDecorator } from '../../decorators/task'

export type NgTaskDecoratorOptions = {
  readonly teardownMethod?: string
}

/**
 * @return {Function}
 */
export function NgTask(
  options?: NgTaskDecoratorOptions,
): (target: any, propertyKey: string) => void
export function NgTask(
  options?: NgTaskDecoratorOptions,
): (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor | void
export function NgTask(
  options?: NgTaskDecoratorOptions,
): (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => any {
  return TaskDecorator({ teardownMethod: 'ngOnDestroy', ...options })
}
