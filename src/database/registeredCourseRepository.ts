import { DeepPartial, getConnection } from 'typeorm'
import { RegisteredCourse } from './model/registeredCourse'
import { ModelType, NestedPartial, NullableOptional } from './type'

type Input = NestedPartial<
  NullableOptional<RegisteredCourse>,
  'tags',
  'name' | 'userId' | 'courses'
>[]

/**
 * 登録済み講義のレポジトリモデル
 */
export default {
  async read(
    userId: string,
    year: number
  ): Promise<ModelType<RegisteredCourse>[]> {
    const repository = getConnection().getRepository(RegisteredCourse)
    const res = await repository.find({
      where: { userId, year },
      relations: ['tags'],
    })
    return res
  },
  create(c: Input): Promise<ModelType<RegisteredCourse[]>> {
    const repository = getConnection().getRepository(RegisteredCourse)
    return repository.save(repository.create(c))
  },
  async update(c: Input): Promise<ModelType<RegisteredCourse[]> | undefined> {
    const repository = getConnection().getRepository(RegisteredCourse)
    if ((await repository.findByIds(c.map((cc) => cc.id))).length !== c.length)
      return
    return repository.save(repository.create(c))
  },
  async delete(ids: string[]): Promise<boolean> {
    const repository = getConnection().getRepository(RegisteredCourse)
    const courses = await repository.findByIds(ids)
    if (courses.length !== ids.length) return false
    await repository.remove(courses)
    return true
  },
}
