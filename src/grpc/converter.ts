/**
 * grpcのメッセージを変換するユーティリティ
 */

import { v4 } from 'uuid'
import {
  ICourseSchedule,
  IRegisteredCourse,
  IRegisteredCourseWithoutId,
  CourseMethod as GCourseMethod,
} from '../../generated'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { CourseMethod, CourseSchedule, Day, Module } from '../database/type'
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

export function grpcCourseToEntity(
  courses: DeepRequired<IRegisteredCourseWithoutId>[]
) {
  return courses
    .map((c) =>
      c.hasBaseRegisteredCourse
        ? unwrapNullableObject(c.hasBaseRegisteredCourse)
        : { ...c.customRegisteredCourse, courseId: null }
    )
    .map(({ tagIds, schedules, methods, ...c }) => ({
      id: v4(),
      tags: (tagIds ?? []).map((id) => ({ id })),
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
    .map(({ schedules, methods, tags, ...c }) => ({
      ...c,
      schedules: entityToGrpcSchedule(schedules),
      methods: methods?.map((m) => GCourseMethod[CourseMethod[m]]),
      tagIds: tags.map((t) => t.id),
    }))
    .map((c) =>
      c.courseId
        ? {
            hasBaseRegisteredCourse: wrapNullableObject(c, [
              'name',
              'instructor',
              'credit',
              'methods',
              'schedules',
            ]),
          }
        : {
            customRegisteredCourse: c,
          }
    )
}
