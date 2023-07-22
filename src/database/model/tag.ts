import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  Unique,
} from 'typeorm'
import { RegisteredCourse } from './registeredCourse'

@Entity({ name: 'tags' })
@Unique(['userId', 'position'], { deferrable: 'INITIALLY DEFERRED' })
export class Tag {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
  })
  id!: string

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string

  @Column({
    name: 'name',
    type: 'text',
  })
  name!: string

  @Column({
    name: 'position',
    type: 'integer',
  })
  position!: number

  @ManyToMany(() => RegisteredCourse, { cascade: ['remove'] })
  @JoinTable({
    name: 'registered_course_tags',
    joinColumn: {
      name: 'tag',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'registered_course',
      referencedColumnName: 'id',
    },
  })
  courses!: RegisteredCourse[]

  @Column({
    name: 'color_hex',
    type: 'string',
  })
  colorHex!: string
}
