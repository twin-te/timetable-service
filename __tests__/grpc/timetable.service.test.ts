import { startGrpcServer, stopGrpcServer } from '../../src/grpc'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import * as grpc from '@grpc/grpc-js'
import {
  CourseMethod,
  CourseSchedule,
  IRegisteredCourseWithoutId,
  ITagWithoutId,
  TimetableService,
} from '../../generated'
import { GrpcClient } from '../../src/grpc/types/type'
import { v4 } from 'uuid'
import { mocked } from 'ts-jest/utils'
import { deepContaining } from '../_deepContaining'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { grpcCourseToEntity } from '../../src/grpc/converter'
import { wrapNullableObject } from '../../src/grpc/nullable'
import {
  AlreadyExistError,
  InvalidArgumentError,
  NotFoundError,
} from '../../src/error'
import { getRegisteredCoursesByYearUseCase } from '../../src/usecase/getRegisteredCoursesByYear'
import { getTagsUseCase } from '../../src/usecase/getTags'
import { createRegisteredCoursesUseCase } from '../../src/usecase/createRegisteredCourses'
import { createTagsUseCase } from '../../src/usecase/createTags'
import { updateRegisteredCourseUseCase } from '../../src/usecase/updateRegisteredCourses'
import { updateTagsUseCase } from '../../src/usecase/updateTags'
import { deleteRegisteredCoursesUseCase } from '../../src/usecase/deleteRegisteredCourses'
import { deleteTagsUseCase } from '../../src/usecase/deleteTags'

jest.mock('../../src/usecase/createRegisteredCourses')
jest.mock('../../src/usecase/createTags')
jest.mock('../../src/usecase/updateRegisteredCourses')
jest.mock('../../src/usecase/updateTags')
jest.mock('../../src/usecase/getRegisteredCoursesByYear')
jest.mock('../../src/usecase/getTags')
jest.mock('../../src/usecase/deleteRegisteredCourses')
jest.mock('../../src/usecase/deleteTags')

const def = protoLoader.loadSync(
  ['TimetableService.proto', 'Nullable.proto', 'Message.proto'].map((p) =>
    path.resolve(__dirname, `../../protos/${p}`)
  )
)
const pkg = grpc.loadPackageDefinition(def)
const Sd = (pkg.TimetableService as unknown) as TimetableService
let client: GrpcClient<TimetableService>

const userId = v4()

function throwUnexpectedError(): never {
  throw new Error('unexpected error!')
}

beforeAll(async () => {
  await startGrpcServer()
  // @ts-ignore
  client = (new Sd(
    'localhost:50051',
    grpc.ChannelCredentials.createInsecure()
  ) as unknown) as GrpcClient<TimetableService>
})

const courses: IRegisteredCourseWithoutId[] = [
  { userId, courseId: v4(), tags: [{ id: v4() }] },
  {
    userId,
    name: 'test name',
    year: 2020,
    instructor: 'test instructor',
    credit: 1.5,
    methods: [CourseMethod.FaceToFace],
    tags: [{ id: v4() }],
    schedules: [
      {
        module: CourseSchedule.Module.SpringA,
        day: CourseSchedule.Day.Mon,
        period: 1,
        room: '3A201',
      },
    ],
  },
].map((c) =>
  wrapNullableObject(c, [
    'name',
    'courseId',
    'instructor',
    'credit',
    'methods',
    'schedules',
  ])
)

const tags: ITagWithoutId[] = [{ userId, name: 'test tag' }]

describe('getRegisteredCourses', () => {
  test('getRegisteredCourses', (done) => {
    mocked(getRegisteredCoursesByYearUseCase).mockImplementation(
      async ({ userId, year }) => {
        expect(userId).toBe(userId)
        expect(year).toBe(2020)
        // @ts-ignore
        return grpcCourseToEntity(courses).map(({ tags, ...cc }) => ({
          ...cc,
          tags: tags.map((t) => ({
            id: t.id,
            userId: cc.userId,
            name: 'tag name',
            courses: [],
          })),
        }))
      }
    )
    client.getRegisteredCoursesByYear({ year: 2020, userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.courses).toEqual(deepContaining(courses))
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(getRegisteredCoursesByYearUseCase).mockImplementation(
      throwUnexpectedError
    )
    client.getRegisteredCoursesByYear({ year: 2020, userId }, (err, res) => {
      expect(err).toBeTruthy()
      done()
    })
  })
})

describe('getTags', () => {
  test('getTags', (done) => {
    // @ts-ignore
    mocked(getTagsUseCase).mockImplementation(async (u) => {
      expect(u.userId).toBe(userId)
      return tags.map((t) => ({ ...t, id: v4(), courses: [] }))
    })
    client.getTags({ userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.tags).toEqual(deepContaining(tags))
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(getTagsUseCase).mockImplementation(throwUnexpectedError)
    client.getTags({ userId }, (err, res) => {
      expect(err).toBeTruthy()
      done()
    })
  })
})

describe('createRegisteredCourses', () => {
  test('createRegisteredCourses', (done) => {
    // @ts-ignore
    mocked(createRegisteredCoursesUseCase).mockImplementation(async (c) => {
      return c.map(({ tags, ...cc }) => ({
        ...cc,
        tags: tags.map((t) => ({
          id: t.id,
          userId: cc.userId,
          name: 'tag name',
        })),
      }))
    })

    client.createRegisteredCourses(
      {
        courses,
      },
      (err, res) => {
        expect(err).toBeFalsy()
        expect(res).toBeTruthy()
        expect(res?.courses).toEqual(deepContaining(courses))
        done()
      }
    )
  })

  test('invalid argument', (done) => {
    mocked(createRegisteredCoursesUseCase).mockImplementation(async () => {
      throw new InvalidArgumentError()
    })
    client.createRegisteredCourses(
      {
        courses: [],
      },
      (err, res) => {
        expect(err?.code).toBe(Status.INVALID_ARGUMENT)
        done()
      }
    )
  })

  test('duplicate key', (done) => {
    mocked(createRegisteredCoursesUseCase).mockImplementation(() => {
      throw new AlreadyExistError('この講義は既に登録されています')
    })
    client.createRegisteredCourses({}, (err, res) => {
      expect(err?.code).toBe(Status.ALREADY_EXISTS)
      expect(err?.message).toMatch(/この講義は既に登録されています/)
      done()
    })
  })

  test('unexpected error!', (done) => {
    mocked(createRegisteredCoursesUseCase).mockImplementation(
      throwUnexpectedError
    )

    client.createRegisteredCourses(
      {
        courses,
      },
      (err, res) => {
        expect(err).toBeTruthy()
        done()
      }
    )
  })
})

describe('createTags', () => {
  test('createTags', (done) => {
    // @ts-ignore
    mocked(createTagsUseCase).mockImplementation(async (t) => t)
    client.createTags({ tags }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.tags).toEqual(deepContaining(tags))
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(createTagsUseCase).mockImplementation(throwUnexpectedError)
    client.createTags({ tags }, (err, res) => {
      expect(err).toBeTruthy()
      done()
    })
  })
})

describe('updateRegisteredCourse', () => {
  test('updateRegisteredCourse', (done) => {
    // @ts-ignore
    mocked(updateRegisteredCourseUseCase).mockImplementation(async (c) => {
      return c.map(({ tags, ...cc }) => ({
        ...cc,
        tags: tags.map((t) => ({
          id: t.id,
          userId: cc.userId,
          name: 'tag name',
        })),
      }))
    })
    client.updateRegisteredCourses(
      {
        courses,
      },
      (err, res) => {
        expect(err).toBeFalsy()
        expect(res).toBeTruthy()
        expect(res?.courses).toEqual(deepContaining(courses))
        done()
      }
    )
  })

  test('updateRegisteredCourse failed', (done) => {
    mocked(updateRegisteredCourseUseCase).mockImplementation(async (c) => {
      throw new NotFoundError('指定された講義は見つかりませんでした')
    })
    client.updateRegisteredCourses(
      {
        courses,
      },
      (err, res) => {
        expect(err?.code).toBe(Status.NOT_FOUND)
        done()
      }
    )
  })

  test('unexpected error', (done) => {
    mocked(updateRegisteredCourseUseCase).mockImplementation(
      throwUnexpectedError
    )
    client.updateRegisteredCourses(
      {
        courses,
      },
      (err, res) => {
        expect(err?.code).toBeTruthy()
        done()
      }
    )
  })
})

describe('updateTags', () => {
  test('updateTags', (done) => {
    const tags: ITagWithoutId[] = [{ userId, name: 'test tag' }]
    // @ts-ignore
    mocked(updateTagsUseCase).mockImplementation(async (t) => t)
    client.updateTags({ tags }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.tags).toEqual(deepContaining(tags))
      done()
    })
  })

  test('updateTags failed', (done) => {
    const tags: ITagWithoutId[] = [{ userId, name: 'test tag' }]
    // @ts-ignore
    mocked(updateTagsUseCase).mockImplementation(async (t) => {
      throw new NotFoundError('指定されたタグは見つかりませんでした')
    })
    client.updateTags({ tags }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(updateTagsUseCase).mockImplementation(throwUnexpectedError)
    client.updateTags({ tags }, (err, res) => {
      expect(err?.code).toBeTruthy()
      done()
    })
  })
})

describe('deleteRegisteredCourse', () => {
  test('deleteRegisteredCourse', (done) => {
    const ids = [v4(), v4()]
    mocked(deleteRegisteredCoursesUseCase).mockImplementation(async (i) => {
      expect(i.ids).toEqual(deepContaining(ids))
      expect(i.userId).toEqual(userId)
    })

    client.deleteRegisteredCourses({ userId, ids }, (err, res) => {
      expect(err).toBeNull()
      done()
    })
  })

  test('deleteRegisteredCourse failed', (done) => {
    const ids = [v4(), v4()]
    mocked(deleteRegisteredCoursesUseCase).mockImplementation(async () => {
      throw new NotFoundError('指定された講義は見つかりませんでした')
    })

    client.deleteRegisteredCourses({ userId, ids }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })
  test('unexpected error', (done) => {
    const ids = [v4(), v4()]
    mocked(deleteRegisteredCoursesUseCase).mockImplementation(
      throwUnexpectedError
    )
    client.deleteRegisteredCourses({ userId, ids }, (err, res) => {
      expect(err?.code).toBeTruthy()
      done()
    })
  })
})

describe('deleteTags', () => {
  test('deleteTags', (done) => {
    const ids = [v4(), v4()]
    mocked(deleteTagsUseCase).mockImplementation(async (i) => {
      expect(i.ids).toEqual(deepContaining(ids))
      expect(i.userId).toEqual(userId)
    })

    client.deleteTags({ userId, ids }, (err, res) => {
      expect(err).toBeNull()
      done()
    })
  })

  test('deleteTags failed', (done) => {
    const ids = [v4(), v4()]
    mocked(deleteTagsUseCase).mockImplementation(async () => {
      throw new NotFoundError('指定されたタグは見つかりませんでした')
    })

    client.deleteTags({ userId, ids }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })

  test('unexpected error', (done) => {
    const ids = [v4(), v4()]
    mocked(deleteTagsUseCase).mockImplementation(throwUnexpectedError)

    client.deleteTags({ userId, ids }, (err, res) => {
      expect(err?.code).toBeTruthy()
      done()
    })
  })
})

afterAll(async () => {
  await stopGrpcServer()
})
