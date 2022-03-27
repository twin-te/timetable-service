import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { RegisteredCourse } from '../../src/database/model/registeredCourse'
import { Tag } from '../../src/database/model/tag'
import { CourseMethod, Day, Module } from '../../src/database/type'
import { NotFoundError } from '../../src/error'
import { deleteRegisteredCoursesUseCase } from '../../src/usecase/deleteRegisteredCourses'
import { clearDB } from '../database/_cleardb'

const userId = v4()
const tags = [
  { id: v4(), userId, name: 'test tag1', position: 0 },
  { id: v4(), userId, name: 'test tag2', position: 1 },
]

const data = [
  {
    id: v4(),
    userId,
    year: 2020,
    courseId: v4(),
    tags: [],
    memo: 'memo',
    attendance: 1,
    absence: 2,
    late: 3,
  },
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
    memo: 'memo',
    attendance: 1,
    absence: 2,
    late: 3,
  },
]

beforeAll(async () => {
  await connectDatabase()
  await clearDB()

  await getConnection().getRepository(Tag).save(tags)
  await getConnection().getRepository(RegisteredCourse).save(data)
})

test('既に存在するデータを正しく削除できる', () => {
  return expect(
    deleteRegisteredCoursesUseCase({ userId, ids: data.map((c) => c.id) })
  ).resolves.toBeUndefined()
})

test('存在しないデータはエラーになる', () => {
  return expect(
    deleteRegisteredCoursesUseCase({ userId, ids: [v4()] })
  ).rejects.toThrow(NotFoundError)
})

test('存在しないデータはエラーになる', () => {
  return expect(
    deleteRegisteredCoursesUseCase({ userId: v4(), ids: data.map((c) => c.id) })
  ).rejects.toThrow(NotFoundError)
})

afterAll(disconnectDatabase)
