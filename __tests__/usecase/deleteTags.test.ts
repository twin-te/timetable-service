import clone from 'clone'
import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { Tag } from '../../src/database/model/tag'
import { NotFoundError } from '../../src/error'
import { deleteTagsUseCase } from '../../src/usecase/deleteTags'
import { updateTagsUseCase } from '../../src/usecase/updateTags'
import { clearDB } from '../database/_cleardb'
import { deepContaining } from '../_deepContaining'

const userId = v4()
const data = [
  { id: v4(), userId, name: 'test tag1' },
  { id: v4(), userId, name: 'test tag2' },
]

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
  await getConnection().getRepository(Tag).save(data)
})

test('正しく削除できる', () => {
  return expect(
    deleteTagsUseCase({ userId, ids: data.map((t) => t.id) })
  ).resolves.toBeUndefined()
})

test('存在しないデータでエラーになる', () => {
  return expect(deleteTagsUseCase({ userId, ids: [v4()] })).rejects.toThrow(
    NotFoundError
  )
})

test('存在しないデータでエラーになる', () => {
  return expect(
    deleteTagsUseCase({ userId: v4(), ids: data.map((t) => t.id) })
  ).rejects.toThrow(NotFoundError)
})

afterAll(disconnectDatabase)
