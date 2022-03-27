import { getConnection } from 'typeorm'
import { Tag } from '../database/model/tag'
import { NotFoundError } from '../error'

type Input = {
  id: string
  userId: string
  name: string
  position: number
}

export async function updateTagsUseCase(tags: Input[]) {
  const repository = getConnection().getRepository(Tag)
  const target = await repository.find({
    where: tags.map(({ id, userId }) => ({ id, userId })),
  })
  if (target.length !== tags.length)
    throw new NotFoundError(
      '指定されたタグが見つかりません',
      undefined,
      tags.filter((c) => !target.find((t) => t.id === c.id)).map((c) => c.id)
    )

  return repository.save(
    tags.map(({ name, position, ...tag }) => ({
      ...tag,
      position:
        position < 0 ? target.find((t) => t.id === tag.id)!.position : position, // < 0 の場合は変更なしとみなす
      name: name || target.find((t) => t.id === tag.id)!.name, // 空文字の場合は変更なしとみなす
    }))
  )
}
