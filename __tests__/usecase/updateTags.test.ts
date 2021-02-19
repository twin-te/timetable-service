import clone from 'clone'
import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { Tag } from '../../src/database/model/tag'
import { NotFoundError } from '../../src/error'
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

test('正しいデータで更新できる', () => {
  const newData = clone(data)
  newData[0].name = 'test tag 3'
  newData[1].name = 'test tag 4'
  return expect(updateTagsUseCase(newData)).resolves.toEqual(
    deepContaining(newData)
  )
})

test('存在しないデータでエラーになる', () => {
  return expect(
    updateTagsUseCase([{ id: v4(), userId, name: '' }])
  ).rejects.toThrow(NotFoundError)
})

afterAll(disconnectDatabase)
