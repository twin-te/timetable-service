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
import registeredCourseRepository from '../../src/database/registeredCourseRepository'
import { deepContaining } from '../_deepContaining'
import tagRepository from '../../src/database/tagRepository'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { grpcCourseToEntity } from '../../src/grpc/converter'
import { wrapNullableObject } from '../../src/grpc/nullable'
import { QueryFailedError } from 'typeorm'

jest.mock('../../src/database/registeredCourseRepository')
jest.mock('../../src/database/tagRepository')

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
    mocked(registeredCourseRepository.read).mockImplementation(async (u, y) => {
      expect(u).toBe(userId)
      expect(y).toBe(2020)
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
    })
    client.getRegisteredCourses({ year: 2020, userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.courses).toEqual(deepContaining(courses))
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(registeredCourseRepository.read).mockImplementation(
      throwUnexpectedError
    )
    client.getRegisteredCourses({ year: 2020, userId }, (err, res) => {
      expect(err).toBeTruthy()
      done()
    })
  })
})

describe('getTags', () => {
  test('getTags', (done) => {
    // @ts-ignore
    mocked(tagRepository.read).mockImplementation(async (u) => {
      expect(u).toBe(userId)
      return tags.map((t) => ({ ...t, id: v4(), courses: [] }))
    })
    client.getTags({ userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.tags).toEqual(deepContaining(tags))
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(tagRepository.read).mockImplementation(throwUnexpectedError)
    client.getTags({ userId }, (err, res) => {
      expect(err).toBeTruthy()
      done()
    })
  })
})

describe('createRegisteredCourses', () => {
  test('createRegisteredCourses', (done) => {
    // @ts-ignore
    mocked(registeredCourseRepository.create).mockImplementation(async (c) => {
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
    mocked(registeredCourseRepository.create).mockImplementation(async () => [])
    client.createRegisteredCourses(
      {
        courses: [
          // @ts-ignore
          wrapNullableObject({ userId }, [
            // @ts-ignore
            'name',
            // @ts-ignore
            'courseId',
            // @ts-ignore
            'instructor',
            // @ts-ignore
            'credit',
            // @ts-ignore
            'methods',
            // @ts-ignore
            'schedules',
          ]),
        ],
      },
      (err, res) => {
        expect(err?.code).toBe(Status.INVALID_ARGUMENT)
        done()
      }
    )
  })

  test('duplicate key', (done) => {
    mocked(registeredCourseRepository.create).mockImplementation(() => {
      throw new QueryFailedError(
        '',
        undefined,
        'duplicate key value violates unique constraint'
      )
    })
    client.createRegisteredCourses({}, (err, res) => {
      expect(err?.code).toBe(Status.INVALID_ARGUMENT)
      expect(err?.message).toMatch(
        /duplicate key value violates unique constraint/
      )
      done()
    })
  })

  test('unexpected error!', (done) => {
    mocked(registeredCourseRepository.create).mockImplementation(
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
    mocked(tagRepository.create).mockImplementation(async (t) => t)
    client.createTags({ tags }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.tags).toEqual(deepContaining(tags))
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(tagRepository.create).mockImplementation(throwUnexpectedError)
    client.createTags({ tags }, (err, res) => {
      expect(err).toBeTruthy()
      done()
    })
  })
})

describe('updateRegisteredCourse', () => {
  test('updateRegisteredCourse', (done) => {
    // @ts-ignore
    mocked(registeredCourseRepository.update).mockImplementation(async (c) => {
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
    mocked(registeredCourseRepository.update).mockImplementation(
      async (c) => undefined
    )
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
    mocked(registeredCourseRepository.update).mockImplementation(
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
    mocked(tagRepository.update).mockImplementation(async (t) => t)
    client.updateTags({ tags }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.tags).toEqual(deepContaining(tags))
      done()
    })
  })

  test('updateTags failed', (done) => {
    const tags: ITagWithoutId[] = [{ userId, name: 'test tag' }]
    // @ts-ignore
    mocked(tagRepository.update).mockImplementation(async (t) => undefined)
    client.updateTags({ tags }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })

  test('unexpected error', (done) => {
    mocked(tagRepository.update).mockImplementation(throwUnexpectedError)
    client.updateTags({ tags }, (err, res) => {
      expect(err?.code).toBeTruthy()
      done()
    })
  })
})

describe('deleteRegisteredCourse', () => {
  test('deleteRegisteredCourse', (done) => {
    const ids = [v4(), v4()]
    mocked(registeredCourseRepository.delete).mockImplementation(async (i) => {
      expect(i).toEqual(deepContaining(ids))
      return true
    })

    client.deleteRegisteredCourses({ ids }, (err, res) => {
      expect(err).toBeNull()
      done()
    })
  })

  test('deleteRegisteredCourse failed', (done) => {
    const ids = [v4(), v4()]
    mocked(registeredCourseRepository.delete).mockImplementation(
      async () => false
    )

    client.deleteRegisteredCourses({ ids }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })
  test('unexpected error', (done) => {
    const ids = [v4(), v4()]
    mocked(registeredCourseRepository.delete).mockImplementation(
      throwUnexpectedError
    )
    client.deleteRegisteredCourses({ ids }, (err, res) => {
      expect(err?.code).toBeTruthy()
      done()
    })
  })
})

describe('deleteTags', () => {
  test('deleteTags', (done) => {
    const ids = [v4(), v4()]
    mocked(tagRepository.delete).mockImplementation(async (i) => {
      expect(i).toEqual(deepContaining(ids))
      return true
    })

    client.deleteTags({ ids }, (err, res) => {
      expect(err).toBeNull()
      done()
    })
  })

  test('deleteTags failed', (done) => {
    const ids = [v4(), v4()]
    mocked(tagRepository.delete).mockImplementation(async () => false)

    client.deleteTags({ ids }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })

  test('unexpected error', (done) => {
    const ids = [v4(), v4()]
    mocked(tagRepository.delete).mockImplementation(throwUnexpectedError)

    client.deleteTags({ ids }, (err, res) => {
      expect(err?.code).toBeTruthy()
      done()
    })
  })
})

afterAll(async () => {
  await stopGrpcServer()
})
