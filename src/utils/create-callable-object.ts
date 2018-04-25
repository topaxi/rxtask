/**
 * @typedef {Function} Callable
 */

/**
 * @param {Object} obj
 * @param {Function} method
 * @return {Callable<Object>}
 */
export function createCallableObject<T extends object, F extends Function>(
  obj: T,
  method: F,
): T & F {
  const methodMap = new WeakMap<Function, Function>()
  const callable: any = new Proxy(method, {
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
      return target.apply(callable, args)
    },
    getPrototypeOf(target) {
      return Object.getPrototypeOf(obj)
    },
  })

  return callable

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
