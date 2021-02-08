import { RegisteredCourse } from './model/registeredCourse'

export enum CourseMethod {
  OnlineAsynchronous = 'OnlineAsynchronous',
  OnlineSynchronous = 'OnlineSynchronous',
  FaceToFace = 'FaceToFace',
  Others = 'Others',
}

export enum Module {
  SpringA = 'SpringA',
  SpringB = 'SpringB',
  SpringC = 'SpringC',
  FallA = 'FallA',
  FallB = 'FallB',
  FallC = 'FallC',
  SummerVacation = 'SummerVacation',
  SpringVacation = 'SpringVacation',
  Annual = 'Annual',
  Unknown = 'Unknown',
}

export enum Day {
  Sun = 'Sun',
  Mon = 'Mon',
  Tue = 'Tue',
  Wed = 'Wed',
  Thu = 'Thu',
  Fri = 'Fri',
  Sat = 'Sat',
  Intensive = 'Intensive',
  Appointment = 'Appointment',
  AnyTime = 'AnyTime',
  Unknown = 'Unknown',
}

export type CourseSchedule = {
  module: Module
  day: Day
  period: number
  room: string
}

export type ModelType<T> = {
  [P in keyof T]: T[P]
}

type MakePartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type UnwrapArray<T> = T extends Array<infer U> ? U : T

type ConditionalArrayWrap<C, T> = C extends Array<any> ? T[] : T

export type NestedPartial<
  T,
  U extends keyof T,
  V extends keyof UnwrapArray<T[U]>
> = Omit<T, U> &
  {
    [K in U]: ConditionalArrayWrap<T[K], MakePartial<UnwrapArray<T[K]>, V>>
  }

type PickByValueType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
}

export type NullableOptional<T> = Partial<PickByValueType<T, null | any>> &
  PickByValueType<T, string | number | boolean | symbol | bigint | object>
