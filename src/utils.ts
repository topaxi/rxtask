import { OneParamFunction } from './interfaces'

export const EMPTY_ARRAY: ReadonlyArray<never> = []

export function assertNever(x: never): never {
  throw new TypeError(`Unkown value ${x}`)
}

export const neq = <T, U extends T>(a: T) => (b: U): b is U => a !== b
export const selectLength = (value: { length: number }) => value.length

export function createCallableObject<T extends object, F extends Function>(
  obj: T,
  method: F,
): T & F {
  const methodMap = new WeakMap<Function, Function>()

  return new Proxy(method, {
    get(target, prop: keyof (T | F), receiver) {
      if (prop in obj) {
        return proxyProperty(obj, prop, receiver)
      }

      if (prop in target) {
        return proxyProperty(target, prop, receiver)
      }

      return undefined
    },
    apply(target, thisArg, args) {
      return target.apply(obj, args)
    },
    getPrototypeOf(target) {
      return Object.getPrototypeOf(obj)
    },
  }) as any

  function getBoundMethod(obj: object, fn: Function, receiver: any): Function {
    return (methodMap.has(fn)
      ? methodMap
      : methodMap.set(fn, function() {
          let ret = fn.apply(obj, arguments)
          return ret === obj ? receiver : ret
        })
    ).get(fn)!
  }

  function proxyProperty<T extends object>(
    obj: T,
    key: keyof T,
    receiver: any,
  ): T[keyof T] {
    if (typeof obj[key] === 'function') {
      return getBoundMethod(obj, obj[key] as any, receiver) as any
    }

    return obj[key]
  }
}

export function pipe<T, A, B, C, D, E>(
  value: T,
  a: OneParamFunction<T, A>,
  b: OneParamFunction<A, B>,
  c: OneParamFunction<B, C>,
  d: OneParamFunction<C, D>,
  e: OneParamFunction<D, E>,
): E
export function pipe<T, A, B, C, D>(
  value: T,
  a: OneParamFunction<T, A>,
  b: OneParamFunction<A, B>,
  c: OneParamFunction<B, C>,
  d: OneParamFunction<C, D>,
): D
export function pipe<T, A, B, C>(
  value: T,
  a: OneParamFunction<T, A>,
  b: OneParamFunction<A, B>,
  c: OneParamFunction<B, C>,
): C
export function pipe<T, A, B>(
  value: T,
  a: OneParamFunction<T, A>,
  b: OneParamFunction<A, B>,
): B
export function pipe<T, A>(value: T, a: OneParamFunction<T, A>): A
export function pipe<T>(value: T): T
export function pipe<T>(value: T, ...args: Function[]): any {
  return args.reduce((val, fn) => fn(val), value)
}
