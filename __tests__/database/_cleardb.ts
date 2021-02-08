import { getConnection } from 'typeorm'
import { RegisteredCourse } from '../../src/database/model/registeredCourse'
import { Tag } from '../../src/database/model/tag'

export async function clearDB() {
  await getConnection().getRepository(Tag).delete({})
  await getConnection().getRepository(RegisteredCourse).delete({})
}
