import clone from 'clone'
import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { Tag } from '../../src/database/model/tag'
import { getTagsUseCase } from '../../src/usecase/getTags'
import { clearDB } from '../database/_cleardb'
import { deepContaining } from '../_deepContaining'

const userId = v4()
const data = [
  { id: v4(), userId, name: 'test tag1', position: 0 },
  { id: v4(), userId, name: 'test tag2', position: 1 },
]

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
  await getConnection().getRepository(Tag).save(data)
})

test('正しいデータを取得できる', () => {
  return expect(getTagsUseCase({ userId })).resolves.toEqual(
    deepContaining(data)
  )
})

test('条件に合うタグがなければ空になる', () => {
  return expect(getTagsUseCase({ userId: v4() })).resolves.toEqual([])
})

afterAll(disconnectDatabase)
