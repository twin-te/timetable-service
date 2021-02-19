import clone from 'clone'
import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { RegisteredCourse } from '../../src/database/model/registeredCourse'
import { Tag } from '../../src/database/model/tag'
import { CourseMethod, Day, Module } from '../../src/database/type'
import { InvalidArgumentError, NotFoundError } from '../../src/error'
import { getRegisteredCoursesUseCase } from '../../src/usecase/getRegisteredCourses'
import { updateRegisteredCourseUseCase } from '../../src/usecase/updateRegisteredCourses'
import { clearDB } from '../database/_cleardb'
import { deepContaining } from '../_deepContaining'

const userId = v4()
const tags = [
  { id: v4(), userId, name: 'test tag1' },
  { id: v4(), userId, name: 'test tag2' },
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

test('データが取得できる', () => {
  return expect(
    getRegisteredCoursesUseCase({ userId, year: 2020 })
  ).resolves.toEqual(deepContaining(data))
})

test('条件に合う講義がない場合は空になる', () => {
  return expect(
    getRegisteredCoursesUseCase({ userId, year: 2021 })
  ).resolves.toEqual([])
})
test('条件に合う講義がない場合は空になる', () => {
  return expect(
    getRegisteredCoursesUseCase({ userId: v4(), year: 2020 })
  ).resolves.toEqual([])
})

afterAll(disconnectDatabase)
