import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { RegisteredCourse } from '../../src/database/model/registeredCourse'
import { Tag } from '../../src/database/model/tag'
import { CourseMethod, Day, Module } from '../../src/database/type'
import { NotFoundError } from '../../src/error'
import { getRegisteredCourseUseCase } from '../../src/usecase/getRegisteredCourse'
import { getRegisteredCoursesByYearUseCase } from '../../src/usecase/getRegisteredCoursesByYear'
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
    getRegisteredCourseUseCase({ userId, id: data[0].id })
  ).resolves.toEqual(deepContaining(data[0]))
})

test('講義が見つからない場合はエラー', () => {
  return expect(
    getRegisteredCourseUseCase({ userId, id: v4() })
  ).rejects.toThrow(NotFoundError)
})

afterAll(disconnectDatabase)
