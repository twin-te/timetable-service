interface Nullable<T> {
  hasValue: boolean
  value: T | null
}

function unwrapNullable<T>(nullable: Nullable<T>): T | null {
  return nullable.hasValue ? nullable.value : null
}

type UnwrapedObject<T> = {
  [K in keyof T]: T[K] extends { hasValue: boolean; value: infer U }
    ? U | null
    : T[K]
}

type WrapedObject<T, U extends keyof T> = Omit<T, U> &
  { [P in U]: Nullable<T[P]> }

export function unwrapNullableObject<T extends { [key: string]: any }>(
  obj: T
): UnwrapedObject<T> {
  const res = { ...obj }
  Object.keys(obj).forEach((k) => {
    const v = obj[k]
    if (typeof v === 'object' && 'hasValue' in v && 'value' in v) {
      // @ts-ignore
      res[k] = unwrapNullable(v)
    }
  })
  return res
}

function wrapNullable<T>(v: T | null): Nullable<T> {
  return {
    hasValue: !!v,
    value: v,
  }
}

export function wrapNullableObject<
  T extends { [key: string]: any },
  U extends keyof T
>(obj: T, keys: U[]): WrapedObject<T, U> {
  const res = { ...obj }
  Object.keys(obj)
    // @ts-ignore
    .filter((k) => keys.includes(k))
    .forEach((k) => {
      // @ts-ignore
      res[k] =
        obj[k] === null || typeof obj[k] === 'undefined'
          ? { hasValue: false }
          : { hasValue: true, value: obj[k] }
    })
  return res
}
