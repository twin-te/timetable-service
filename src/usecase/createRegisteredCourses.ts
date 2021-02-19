import { getConnection, QueryFailedError } from 'typeorm'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { CourseMethod, Day, Module } from '../database/type'
import { AlreadyExistError, InvalidArgumentError } from '../error'

type Input = {
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
}

export async function createRegisteredCoursesUseCase(courses: Input[]) {
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
    const repo = getConnection().getRepository(RegisteredCourse)
    const res = await repo.save(repo.create(courses))
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
