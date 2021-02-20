import { getConnection, QueryFailedError } from 'typeorm'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { CourseMethod, Day, Module } from '../database/type'
import {
  AlreadyExistError,
  InvalidArgumentError,
  NotFoundError,
} from '../error'

type Input = {
  id: string
  userId: string
  year: number
  courseId?: string | null
  name?: string | null
  instructor?: string | null
  credit?: number | null
  methods?: CourseMethod[] | null
  schedules?:
    | {
        module: Module
        day: Day
        period: number
        room: string
      }[]
    | null
  tags: { id: string }[]
  memo: string
  attendance: number
  absence: number
  late: number
}

export async function updateRegisteredCourseUseCase(courses: Input[]) {
  courses.forEach((c) => {
    if (
      !c.courseId &&
      (!hasValue(c.name) ||
        !hasValue(c.instructor) ||
        !hasValue(c.credit) ||
        !hasValue(c.methods) ||
        !hasValue(c.schedules))
    )
      throw new InvalidArgumentError(
        'nullが許可されるのはベース講義がある場合のみです'
      )
  })
  try {
    const repository = getConnection().getRepository(RegisteredCourse)
    const target = await repository.find({
      where: courses.map(({ id, userId }) => ({ id, userId })),
    })
    if (target.length !== courses.length)
      throw new NotFoundError(
        '指定された講義は見つかりませんでした',
        undefined,
        courses
          .filter((c) => !target.find((t) => t.id === c.id))
          .map((c) => c.id)
      )
    const res = await repository.save(repository.create(courses))
    return res
  } catch (e) {
    if (
      e instanceof QueryFailedError &&
      e.message.includes('duplicate key value violates unique constraint')
    )
      throw new AlreadyExistError('指定された講義は既に登録されています', e)
    else throw e
  }
}

function hasValue(o: any): boolean {
  return o !== null && typeof o !== 'undefined'
}
