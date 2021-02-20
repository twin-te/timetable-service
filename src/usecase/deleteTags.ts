import { getConnection } from 'typeorm'
import { Tag } from '../database/model/tag'
import { NotFoundError } from '../error'

type Input = {
  userId: string
  ids: string[]
}

export async function deleteTagsUseCase({ userId, ids }: Input) {
  const repository = getConnection().getRepository(Tag)
  const target = await repository.find({
    where: ids.map((id) => ({ id, userId })),
  })
  if (target.length !== ids.length)
    throw new NotFoundError(
      '指定されたタグは見つかりませんでした',
      undefined,
      ids.filter((c) => !target.find((t) => t.id === c))
    )
  await repository.remove(target)
}
