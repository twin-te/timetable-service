import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database/index'
import registeredCourseRepository from '../../src/database/registeredCourseRepository'
import tagRepository from '../../src/database/tagRepository'
import { CourseMethod, Day, Module } from '../../src/database/type'
import clone from 'clone'
import { clearDB } from './_cleardb'
import { deepContaining } from '../_deepContaining'

const userId = v4()
const tags = [
  { id: v4(), userId, name: 'test tag1' },
  { id: v4(), userId, name: 'test tag2' },
]

const data = [
  { id: v4(), userId, year: 2020, courseId: v4(), tags: [] },
  {
    id: v4(),
    userId,
    year: 2020,
    name: 'custom course name',
    instructor: 'custom instructor name',
    credit: 1.5,
    methods: [CourseMethod.OnlineAsynchronous, CourseMethod.FaceToFace],
    schedules: [
      {
        module: Module.SpringA,
        day: Day.Mon,
        period: 1,
        room: '3A201',
      },
    ],
    tags: [{ id: tags[0].id }],
  },
]

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
  await tagRepository.create(tags)
})

test('create', async () => {
  const res = await registeredCourseRepository.create(data)
  expect(res.length).toBe(data.length)
  expect(res).toEqual(deepContaining(data))
})

test('read', async () => {
  const res = await registeredCourseRepository.read(userId, 2020)
  expect(res.length).toBe(data.length)
  expect(res).toEqual(deepContaining(data))
})

test('update', async () => {
  const updatedData = clone(data)
  updatedData[1].name = 'custom course name2'
  const res = await registeredCourseRepository.update(updatedData)
  expect(res).not.toBeUndefined()
  expect(res!.length).toBe(updatedData.length)
  expect(res).toEqual(deepContaining(updatedData))
})

test('update failure', async () => {
  const updatedData = clone(data)
  updatedData[0].id = v4()
  const res = await registeredCourseRepository.update(updatedData)
  expect(res).toBeUndefined()
})

test('delete', async () => {
  const res = await registeredCourseRepository.delete(data.map((d) => d.id))
  expect(res).toBeTruthy()
  const res2 = await registeredCourseRepository.read(userId, 2020)
  expect(res2.length).toBe(0)
})

test('delete failure', async () => {
  const res = await registeredCourseRepository.delete([v4()])
  expect(res).toBeFalsy()
})

afterAll(disconnectDatabase)
