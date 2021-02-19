import { getConnection } from 'typeorm'
import { Tag } from '../database/model/tag'

type Input = {
  userId: string
}

export function getTagsUseCase({ userId }: Input) {
  const repository = getConnection().getRepository(Tag)
  return repository.find({ userId })
}
