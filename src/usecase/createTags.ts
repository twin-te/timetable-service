import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { Tag } from '../database/model/tag'

type Input = {
  userId: string
  name: string
}

export function createTagsUseCase(tags: Input[]) {
  const repository = getConnection().getRepository(Tag)
  return repository.save(
    repository.create(tags.map((t) => ({ ...t, id: v4() })))
  )
}
