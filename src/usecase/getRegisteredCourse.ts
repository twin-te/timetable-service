import { getRepository } from 'typeorm'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { NotFoundError } from '../error'

type Input = {
  userId: string
  id: string
}

export async function getRegisteredCourseUseCase({ userId, id }: Input) {
  const res = await getRepository(RegisteredCourse).findOne({
    where: { userId, id },
    relations: ['tags'],
  })
  if (!res) throw new NotFoundError('指定されたidの講義は登録されていません')
  return res
}
