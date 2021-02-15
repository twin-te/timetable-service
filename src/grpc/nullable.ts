/**
 * grpcでnullを表現するためにprotoで宣言したnullable型変換用のユーティリティ
 * @see ../../protos/nullable.proto
 */

/**
 * grpcでnullを表すための型
 * hasValueがfalseならvalueが何であれnullとする
 */
interface Nullable<T> {
  hasValue: boolean
  value: T | null
}

type UnwrapedObject<T> = {
  [K in keyof T]: T[K] extends { hasValue: boolean; value: infer U }
    ? U | null
    : T[K]
}

type WrapedObject<T, U extends keyof T> = Omit<T, U> &
  { [P in U]: Nullable<T[P]> }

/**
 * nullableをアンラップする
 * @param nullable
 */
function unwrapNullable<T>(nullable: Nullable<T>): T | null {
  return nullable.hasValue ? nullable.value : null
}

/**
 * 指定されたオブジェクト内にあるnullableを自動でアンラップする
 * @param obj
 */
export function unwrapNullableObject<T extends { [key: string]: any }>(
  obj: T
): UnwrapedObject<T> {
  const res = { ...obj }
  Object.keys(obj).forEach((k) => {
    const v = obj[k]
    if (
      v !== null &&
      typeof v === 'object' &&
      'hasValue' in v &&
      'value' in v
    ) {
      // @ts-ignore
      res[k] = unwrapNullable(v)
    }
  })
  return res
}

/**
 * nullableを作成する
 * @param v
 */
function wrapNullable<T>(v: T | null): Nullable<T> {
  const hasValue = v !== null && typeof v !== 'undefined'
  return {
    hasValue,
    value: hasValue ? v : null,
  }
}

/**
 * 指定されたプロパティをnullableでラップする
 * @param obj 対象オブジェクト
 * @param keys ラップしたいプロパティ名
 */
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
      res[k] = wrapNullable(obj[k])
    })
  return res
}
