import { getConnection } from 'typeorm'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { NotFoundError } from '../error'

type Input = {
  userId: string
  ids: string[]
}

export async function deleteRegisteredCoursesUseCase({ userId, ids }: Input) {
  const repository = getConnection().getRepository(RegisteredCourse)
  const target = await repository.find({
    where: ids.map((id) => ({ id, userId })),
  })
  if (target.length !== ids.length)
    throw new NotFoundError(
      '指定された講義は見つかりませんでした',
      undefined,
      ids.filter((c) => !target.find((t) => t.id === c))
    )
  await repository.remove(target)
}
