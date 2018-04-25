import { UnaryFunction } from '../interfaces'

export function pipe<T, A, B, C, D, E>(
  value: T,
  a: UnaryFunction<T, A>,
  b: UnaryFunction<A, B>,
  c: UnaryFunction<B, C>,
  d: UnaryFunction<C, D>,
  e: UnaryFunction<D, E>,
): E
export function pipe<T, A, B, C, D>(
  value: T,
  a: UnaryFunction<T, A>,
  b: UnaryFunction<A, B>,
  c: UnaryFunction<B, C>,
  d: UnaryFunction<C, D>,
): D
export function pipe<T, A, B, C>(
  value: T,
  a: UnaryFunction<T, A>,
  b: UnaryFunction<A, B>,
  c: UnaryFunction<B, C>,
): C
export function pipe<T, A, B>(
  value: T,
  a: UnaryFunction<T, A>,
  b: UnaryFunction<A, B>,
): B
export function pipe<T, A>(value: T, a: UnaryFunction<T, A>): A
export function pipe<T>(value: T): T
export function pipe<T, R>(value: T, ...args: UnaryFunction<any, any>[]): R
export function pipe<T>(value: T, ...args: UnaryFunction<any, any>[]): any
/**
 * @param {any} value
 * @param {...UnaryFunction} args
 * @return {any}
 */
export function pipe<T>(value: T, ...args: UnaryFunction<any, any>[]): any {
  return args.reduce((val, fn) => fn(val), value)
}
