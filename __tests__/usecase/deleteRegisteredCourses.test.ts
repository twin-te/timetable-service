import clone from 'clone'
import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { RegisteredCourse } from '../../src/database/model/registeredCourse'
import { Tag } from '../../src/database/model/tag'
import { CourseMethod, Day, Module } from '../../src/database/type'
import { InvalidArgumentError, NotFoundError } from '../../src/error'
import { deleteRegisteredCoursesUseCase } from '../../src/usecase/deleteRegisteredCourses'
import { updateRegisteredCourseUseCase } from '../../src/usecase/updateRegisteredCourses'
import { clearDB } from '../database/_cleardb'
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

  await getConnection().getRepository(Tag).save(tags)
  await getConnection().getRepository(RegisteredCourse).save(data)
})

test('既に存在するデータを正しく削除できる', () => {
  return expect(
    deleteRegisteredCoursesUseCase(data.map((c) => c.id))
  ).resolves.toBeUndefined()
})

test('存在しないデータはエラーになる', () => {
  return expect(deleteRegisteredCoursesUseCase([v4()])).rejects.toThrow(
    NotFoundError
  )
})

afterAll(disconnectDatabase)
