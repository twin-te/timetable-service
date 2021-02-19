import { GrpcServer } from './types/type'
import {
  CreateRegisterCoursesResponse,
  CreateTagsResponse,
  DeleteRegisteredCoursesResponse,
  DeleteTagsResponse,
  GetRegisteredCoursesResponse,
  GetTagsResponse,
  TimetableService,
  UpdateRegisteredCoursesResponse,
  UpdateTagsResponse,
} from '../../generated/index'
import {
  entityToGrpcCourse,
  grpcCourseToEntity,
  toGrpcError,
} from './converter'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { getRegisteredCoursesUseCase } from '../usecase/getRegisteredCourses'
import { getTagsUseCase } from '../usecase/getTags'
import { createRegisteredCoursesUseCase } from '../usecase/createRegisteredCourses'
import { createTagsUseCase } from '../usecase/createTags'
import { updateRegisteredCourseUseCase } from '../usecase/updateRegisteredCourses'
import { updateTagsUseCase } from '../usecase/updateTags'
import { deleteRegisteredCoursesUseCase } from '../usecase/deleteRegisteredCourses'
import { deleteTagsUseCase } from '../usecase/deleteTags'

/**
 * TimetableServiceの実装
 */
export const timetableService: GrpcServer<TimetableService> = {
  async getRegisteredCourses({ request }, callback) {
    try {
      const courses = await getRegisteredCoursesUseCase(request)
      callback(
        null,
        GetRegisteredCoursesResponse.create({
          courses: entityToGrpcCourse(courses),
        })
      )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async getTags({ request }, callback) {
    try {
      const tags = await getTagsUseCase(request)
      callback(null, GetTagsResponse.create({ tags }))
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async createRegisteredCourses({ request }, callback) {
    try {
      const courses = await createRegisteredCoursesUseCase(
        grpcCourseToEntity(request.courses)
      )
      callback(
        null,
        CreateRegisterCoursesResponse.create({
          courses: entityToGrpcCourse(courses),
        })
      )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async createTags({ request }, callback) {
    try {
      const tags = await createTagsUseCase(request.tags)
      callback(
        null,
        CreateTagsResponse.create({
          tags,
        })
      )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async updateRegisteredCourses({ request }, callback) {
    try {
      const courses = await updateRegisteredCourseUseCase(
        grpcCourseToEntity(request.courses)
      )
      if (!courses) callback({ code: Status.NOT_FOUND })
      else
        callback(
          null,
          UpdateRegisteredCoursesResponse.create({
            courses: entityToGrpcCourse(courses),
          })
        )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async updateTags({ request }, callback) {
    try {
      const tags = await updateTagsUseCase(request.tags)
      if (!tags) callback({ code: Status.NOT_FOUND })
      else
        callback(
          null,
          UpdateTagsResponse.create({
            tags,
          })
        )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async deleteRegisteredCourses({ request }, callback) {
    try {
      await deleteRegisteredCoursesUseCase(request.ids)
      callback(null, DeleteRegisteredCoursesResponse.create({}))
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async deleteTags({ request }, callback) {
    try {
      await deleteTagsUseCase(request.ids)
      callback(null, DeleteTagsResponse.create({}))
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
}
