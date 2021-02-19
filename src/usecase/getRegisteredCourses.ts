import { getConnection } from 'typeorm'
import { RegisteredCourse } from '../database/model/registeredCourse'

type Input = {
  userId: string
  year: number
}

export async function getRegisteredCoursesUseCase({ userId, year }: Input) {
  const repository = getConnection().getRepository(RegisteredCourse)
  const res = await repository.find({
    where: { userId, year },
    relations: ['tags'],
  })
  return res
}
