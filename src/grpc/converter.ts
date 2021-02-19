/**
 * grpcのメッセージを変換するユーティリティ
 */

import { Metadata, StatusObject } from '@grpc/grpc-js'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { ServerErrorResponse } from '@grpc/grpc-js/build/src/server-call'
import {
  ICourseSchedule,
  IRegisteredCourse,
  IRegisteredCourseWithoutId,
  CourseMethod as GCourseMethod,
} from '../../generated'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { CourseMethod, CourseSchedule, Day, Module } from '../database/type'
import {
  AlreadyExistError,
  InvalidArgumentError,
  NotFoundError,
} from '../error'
import { unwrapNullableObject, wrapNullableObject } from './nullable'
import { DeepRequired } from './types/type'

function grpcScheduleToEntity(
  schedules: DeepRequired<ICourseSchedule>[] | null
): CourseSchedule[] | null {
  return schedules
    ? schedules?.map(({ module, day, ...s }) => ({
        module: Object.values(Module)[module],
        day: Object.values(Day)[day],
        ...s,
      }))
    : null
}

export function grpcCourseToEntity(courses: DeepRequired<IRegisteredCourse>[]) {
  return courses
    .map(unwrapNullableObject)
    .map(({ schedules, methods, ...c }) => ({
      schedules: grpcScheduleToEntity(schedules),
      methods: methods
        ? methods.map((m) => Object.values(CourseMethod)[m])
        : null,
      ...c,
    }))
}

export function grpcCourseToEntityWithoutId(
  courses: DeepRequired<IRegisteredCourseWithoutId>[]
) {
  return courses
    .map(unwrapNullableObject)
    .map(({ schedules, methods, ...c }) => ({
      schedules: grpcScheduleToEntity(schedules),
      methods: methods
        ? methods.map((m) => Object.values(CourseMethod)[m])
        : null,
      ...c,
    }))
}

function entityToGrpcSchedule(
  schedules: CourseSchedule[] | null
): ICourseSchedule[] | null {
  return schedules
    ? schedules?.map(({ module, day, ...s }) => ({
        module: Object.keys(Module).indexOf(module),
        day: Object.keys(Day).indexOf(day),
        ...s,
      }))
    : null
}

export function entityToGrpcCourse(
  courses: RegisteredCourse[]
): IRegisteredCourse[] {
  return courses
    .map(({ schedules, methods, ...c }) => ({
      ...c,
      schedules: entityToGrpcSchedule(schedules),
      methods: methods?.map((m) => GCourseMethod[CourseMethod[m]]),
    }))
    .map((c) =>
      wrapNullableObject(c, [
        'courseId',
        'name',
        'instructor',
        'credit',
        'methods',
        'schedules',
      ])
    )
}

export function toGrpcError(
  e: Error
): Partial<StatusObject> | ServerErrorResponse {
  if (e instanceof NotFoundError)
    return Object.assign(e, {
      code: Status.NOT_FOUND,
      metadata: makeMetadata({ resources: e.resources }),
    })
  else if (e instanceof InvalidArgumentError)
    return Object.assign(e, {
      code: Status.INVALID_ARGUMENT,
      metadata: makeMetadata({ args: e.args }),
    })
  else if (e instanceof AlreadyExistError)
    return Object.assign(e, {
      code: Status.ALREADY_EXISTS,
    })
  else return Object.assign(e, { code: Status.UNKNOWN })
}

function makeMetadata(obj: any): Metadata {
  const metadata = new Metadata()
  Object.keys(obj).forEach((k) => metadata.add(k, obj[k]))
  return metadata
}
