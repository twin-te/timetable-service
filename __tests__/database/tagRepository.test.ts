import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database/index'
import registeredCourseRepository from '../../src/database/registeredCourseRepository'
import tagRepository from '../../src/database/tagRepository'
import clone from 'clone'
import { clearDB } from './_cleardb'
import { deepContaining } from '../_deepContaining'

const userId = v4()
const data = [
  { id: v4(), userId, name: 'test tag1' },
  { id: v4(), userId, name: 'test tag2' },
]

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('create', async () => {
  const res = await tagRepository.create(data)
  expect(res.length).toBe(data.length)
  expect(res).toEqual(deepContaining(data))
})

test('read', async () => {
  const res = await tagRepository.read(userId)
  expect(res.length).toBe(data.length)
  expect(res).toEqual(deepContaining(data))
})

test('update', async () => {
  const updatedData = clone(data)
  updatedData[1].name = 'test tag1 v2'
  const res = await tagRepository.update(updatedData)
  expect(res).not.toBeUndefined()
  expect(res!.length).toBe(updatedData.length)
  expect(res).toEqual(deepContaining(updatedData))
})

test('update failure', async () => {
  const updatedData = clone(data)
  updatedData[0].id = v4()
  const res = await tagRepository.update(updatedData)
  expect(res).toBeUndefined()
})

test('delete', async () => {
  const res = await tagRepository.delete(data.map((d) => d.id))
  expect(res).toBeTruthy()
  const res2 = await tagRepository.read(userId)
  expect(res2.length).toBe(0)
})

test('delete failure', async () => {
  const res = await registeredCourseRepository.delete([v4()])
  expect(res).toBeFalsy()
})

afterAll(disconnectDatabase)
