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
import { v4 } from 'uuid'
import tagRepository from '../database/tagRepository'
import registeredCourseRepository from '../database/registeredCourseRepository'
import { entityToGrpcCourse, grpcCourseToEntity } from './converter'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { QueryFailedError } from 'typeorm'

/**
 * TimetableServiceの実装
 */
export const timetableService: GrpcServer<TimetableService> = {
  async getRegisteredCourses({ request }, callback) {
    try {
      const courses = await registeredCourseRepository.read(
        request.userId,
        request.year
      )
      callback(
        null,
        GetRegisteredCoursesResponse.create({
          courses: entityToGrpcCourse(courses),
        })
      )
    } catch (e) {
      callback(e)
    }
  },
  async getTags({ request }, callback) {
    try {
      const tags = await tagRepository.read(request.userId)
      callback(null, GetTagsResponse.create({ tags }))
    } catch (e) {
      callback(e)
    }
  },
  async createRegisteredCourses({ request }, callback) {
    try {
      const courses = await registeredCourseRepository.create(
        grpcCourseToEntity(request.courses)
      )
      callback(
        null,
        CreateRegisterCoursesResponse.create({
          courses: entityToGrpcCourse(courses),
        })
      )
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        e.message.includes('duplicate key value violates unique constraint')
      )
        callback(Object.assign(e, { code: Status.INVALID_ARGUMENT }))
      else callback(e)
    }
  },
  async createTags({ request }, callback) {
    try {
      const tags = await tagRepository.create(
        request.tags.map((t) => ({ ...t, id: v4() }))
      )
      callback(
        null,
        CreateTagsResponse.create({
          tags,
        })
      )
    } catch (e) {
      callback(e)
    }
  },
  async updateRegisteredCourses({ request }, callback) {
    try {
      const courses = await registeredCourseRepository.update(
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
      callback(e)
    }
  },
  async updateTags({ request }, callback) {
    try {
      const tags = await tagRepository.update(request.tags)
      if (!tags) callback({ code: Status.NOT_FOUND })
      else
        callback(
          null,
          UpdateTagsResponse.create({
            tags,
          })
        )
    } catch (e) {
      callback(e)
    }
  },
  async deleteRegisteredCourses({ request }, callback) {
    try {
      const success = await registeredCourseRepository.delete(request.ids)
      if (!success) callback({ code: Status.NOT_FOUND })
      else callback(null, DeleteRegisteredCoursesResponse.create({}))
    } catch (e) {
      callback(e)
    }
  },
  async deleteTags({ request }, callback) {
    try {
      const success = await tagRepository.delete(request.ids)
      if (!success) callback({ code: Status.NOT_FOUND })
      else callback(null, DeleteTagsResponse.create({}))
    } catch (e) {
      callback(e)
    }
  },
}
