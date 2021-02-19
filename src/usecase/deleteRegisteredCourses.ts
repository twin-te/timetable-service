import { getConnection } from 'typeorm'
import { RegisteredCourse } from '../database/model/registeredCourse'
import { NotFoundError } from '../error'

type Input = string[]

export async function deleteRegisteredCoursesUseCase(ids: Input) {
  const repository = getConnection().getRepository(RegisteredCourse)
  const target = await repository.findByIds(ids)
  if (target.length !== ids.length)
    throw new NotFoundError(
      '指定された講義は見つかりませんでした',
      undefined,
      ids.filter((c) => !target.find((t) => t.id === c))
    )
  await repository.remove(target)
}
