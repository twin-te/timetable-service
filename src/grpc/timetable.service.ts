import { GrpcServer } from './types/type'
import {
  CreateRegisterCoursesResponse,
  CreateTagsResponse,
  DeleteRegisteredCoursesResponse,
  DeleteTagsResponse,
  GetRegisteredCoursesResponse,
  TimetableService,
  UpdateRegisteredCoursesResponse,
  UpdateTagsResponse,
} from '../../generated/index'
import { v4 } from 'uuid'
import tagRepository from '../database/tagRepository'
import registeredCourseRepository from '../database/registeredCourseRepository'
import { entityToGrpcCourse, grpcCourseToEntity } from './converter'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { sendUnaryData } from '@grpc/grpc-js'

function handleError(callback: sendUnaryData<any>) {
  return (reason: any) => {
    callback(reason)
  }
}

export const timetableService: GrpcServer<TimetableService> = {
  getRegisteredCourses({ request }, callback) {
    registeredCourseRepository
      .read(request.userId, request.year)
      .then((courses) => {
        callback(
          null,
          GetRegisteredCoursesResponse.create({
            courses: entityToGrpcCourse(courses),
          })
        )
      })
      .catch(handleError(callback))
  },
  getTags({ request }, callback) {},
  createRegisteredCourses({ request }, callback) {
    registeredCourseRepository
      .create(grpcCourseToEntity(request.courses))
      .then((courses) => {
        callback(
          null,
          CreateRegisterCoursesResponse.create({
            courses: entityToGrpcCourse(courses),
          })
        )
      })
      .catch(handleError(callback))
  },
  createTags({ request }, callback) {
    tagRepository
      .create(request.tags.map((t) => ({ ...t, id: v4() })))
      .then((tags) => {
        callback(
          null,
          CreateTagsResponse.create({
            tags,
          })
        )
      })
      .catch(handleError(callback))
  },
  updateRegisteredCourses({ request }, callback) {
    registeredCourseRepository
      .update(grpcCourseToEntity(request.courses))
      .then((courses) => {
        if (!courses) callback({ code: Status.NOT_FOUND })
        else
          callback(
            null,
            UpdateRegisteredCoursesResponse.create({
              courses: entityToGrpcCourse(courses),
            })
          )
      })
      .catch(handleError(callback))
  },
  updateTags({ request }, callback) {
    tagRepository
      .update(request.tags)
      .then((tags) => {
        if (!tags) callback({ code: Status.NOT_FOUND })
        else
          callback(
            null,
            UpdateTagsResponse.create({
              tags,
            })
          )
      })
      .catch(handleError(callback))
  },
  deleteRegisteredCourses({ request }, callback) {
    registeredCourseRepository
      .delete(request.ids)
      .then((success) => {
        if (!success) callback({ code: Status.NOT_FOUND })
        else callback(null, DeleteRegisteredCoursesResponse.create({}))
      })
      .catch(handleError(callback))
  },
  deleteTags({ request }, callback) {
    tagRepository
      .delete(request.ids)
      .then((success) => {
        if (!success) callback({ code: Status.NOT_FOUND })
        else callback(null, DeleteTagsResponse.create({}))
      })
      .catch(handleError(callback))
  },
}
