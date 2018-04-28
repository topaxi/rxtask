export type Dict<T> = { [key: string]: T }

export type Accumulator<T, R> = (
  acc: R,
  value: T,
  key: keyof Dict<T>,
  index: number,
  keys: (keyof Dict<T>)[],
  self: Dict<T>,
) => R

export type MonoTypeAccumulator<T> = Accumulator<T, T>

export function reduce<T>(
  dict: Dict<T>,
  accumulator: MonoTypeAccumulator<T>,
  seed?: T,
): T
export function reduce<T, R>(
  dict: Dict<T>,
  accumulator: Accumulator<T, R>,
  seed?: R,
): R
export function reduce(
  dict: Dict<any>,
  accumulator: Function,
  seed?: any,
): any {
  return Object.keys(dict).reduce(
    (acc, key, i, keys) => accumulator(acc, dict[key], key, i, keys, dict),
    seed,
  )
}

export function map<T, R>(
  dict: Dict<T>,
  project: (
    value: T,
    key: string,
    i: number,
    keys: string[],
    self: Dict<T>,
  ) => R,
): Dict<R> {
  return reduce(
    dict,
    (d, value, key, i, keys, self) => (
      (d[key] = project(value, key, i, keys, self)), d
    ),
    {} as Dict<R>,
  )
}

export function filter<T, S extends T>(
  dict: Dict<T>,
  filter: (v: T) => v is S,
): Dict<S> {
  return reduce(
    dict,
    (d, value, key) => (filter(value) && (d[key] = value), d),
    {} as Dict<S>,
  )
}
