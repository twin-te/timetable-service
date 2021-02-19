import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { createTagsUseCase } from '../../src/usecase/createTags'
import { clearDB } from '../database/_cleardb'
import { deepContaining } from '../_deepContaining'

const userId = v4()
const data = [
  { userId, name: 'test tag1' },
  { userId, name: 'test tag2' },
]

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('create', async () => {
  const res = await createTagsUseCase(data)
  expect(res.length).toBe(data.length)
  expect(res).toEqual(deepContaining(data))
})

afterAll(disconnectDatabase)
