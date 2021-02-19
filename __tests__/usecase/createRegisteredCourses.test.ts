import clone from 'clone'
import { Module, CourseMethod, Day } from '../../src/database/type'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'

import { AlreadyExistError, InvalidArgumentError } from '../../src/error'
import { createRegisteredCoursesUseCase } from '../../src/usecase/createRegisteredCourses'
import { clearDB } from '../database/_cleardb'
import { deepContaining } from '../_deepContaining'
import { getConnection } from 'typeorm'
import { Tag } from '../../src/database/model/tag'

const userId = v4()
const tags = [
  { id: v4(), userId, name: 'test tag1' },
  { id: v4(), userId, name: 'test tag2' },
]

const data = [
  { userId, year: 2020, courseId: v4(), tags: [] },
  {
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
  await getConnection().getRepository(Tag).save(tags)
})

test('正しいデータで作成できる', async () => {
  const res = await createRegisteredCoursesUseCase(data)
  expect(res.length).toBe(data.length)
  expect(res).toEqual(deepContaining(data))
})

test('同じ講義を登録しようとするとエラーになる', () => {
  // courseIdとuserIdがダブったデータ
  const duplicateData = clone(data)[0]
  return expect(
    createRegisteredCoursesUseCase([duplicateData])
  ).rejects.toThrow(AlreadyExistError)
})

test('カスタム講義の場合、全ての情報が存在しない場合にエラーになる', () => {
  const broken = {
    id: v4(),
    userId,
    year: 2020,
    name: 'custom course name',
    instructor: 'custom instructor name',
    // credit: 1.5,
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
  }
  return expect(createRegisteredCoursesUseCase([broken])).rejects.toThrow(
    InvalidArgumentError
  )
})

afterAll(disconnectDatabase)
