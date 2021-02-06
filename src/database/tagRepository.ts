import { DeepPartial, getConnection } from 'typeorm'
import { Tag } from './model/tag'
import { ModelType } from './type'

/**
 * タグのレポジトリモデル
 */
export default {
  create(t: DeepPartial<Tag>[]): Promise<ModelType<Tag>[]> {
    const repository = getConnection().getRepository(Tag)
    return repository.save(repository.create(t))
  },
  read(userId: string): Promise<ModelType<Tag[]>> {
    const repository = getConnection().getRepository(Tag)
    return repository.find({ userId })
  },
  async update(t: DeepPartial<Tag>[]): Promise<ModelType<Tag>[] | undefined> {
    const repository = getConnection().getRepository(Tag)
    if ((await repository.findByIds(t.map((tt) => tt.id))).length !== t.length)
      return
    return repository.save(repository.create(t))
  },
  async delete(ids: string[]): Promise<boolean> {
    const repository = getConnection().getRepository(Tag)
    const tags = await repository.findByIds(ids)
    if (tags.length !== ids.length) return false
    await repository.remove(tags)
    return true
  },
}
