import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { Tag } from '../database/model/tag'
import { InvalidArgumentError } from '../error'

type Input = {
  userId: string
  name: string
}

async function createTagsForUser(userId: string, names: string[]) {
  const repository = getConnection().getRepository(Tag)
  const lastTag = await repository.findOne({
    order: { position: 'DESC' },
    where: { userId },
  })
  let lastId = lastTag?.position ?? 0
  return repository.save(
    names.map((name) => ({ id: v4(), name, userId, position: ++lastId }))
  )
}

export async function createTagsUseCase(tags: Input[]) {
  if (tags.length === 0)
    throw new InvalidArgumentError('データが一つ以上必要です')
  const args = tags.reduce<Record<string, string[]>>((p, c) => {
    ;(p[c.userId] ?? (p[c.userId] = [])).push(c.name)
    return p
  }, {})

  const result = await Promise.all(
    Object.entries(args).map(([userId, names]) =>
      createTagsForUser(userId, names)
    )
  )

  return result.flat()
}
