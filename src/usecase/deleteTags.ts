import { getConnection } from 'typeorm'
import { Tag } from '../database/model/tag'
import { NotFoundError } from '../error'

type Input = string[]

export async function deleteTagsUseCase(ids: Input) {
  const repository = getConnection().getRepository(Tag)
  const target = await repository.findByIds(ids)
  if (target.length !== ids.length)
    throw new NotFoundError(
      '指定されたタグは見つかりませんでした',
      undefined,
      ids.filter((c) => !target.find((t) => t.id === c))
    )
  await repository.remove(target)
}
