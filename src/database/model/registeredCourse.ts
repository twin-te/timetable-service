import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm'
import { CourseMethod, CourseSchedule } from '../type'
import { Tag } from './tag'

@Entity({
  name: 'registered_courses',
})
export class RegisteredCourse {
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
    name: 'year',
    type: 'smallint',
  })
  year!: number

  @Column({
    name: 'course_id',
    type: 'uuid',
    nullable: true,
  })
  courseId!: string | null

  @Column({
    name: 'name',
    type: 'text',
    nullable: true,
  })
  name!: string | null

  @Column({
    name: 'instractor',
    type: 'text',
    nullable: true,
  })
  instructor!: string | null

  @Column({
    name: 'credit',
    type: 'numeric',
    nullable: true,
    transformer: {
      from: (v?: string) => (v ? Number(v) : null),
      to: (v) => v,
    },
  })
  credit!: number | null

  @Column({
    name: 'methods',
    type: 'enum',
    enum: CourseMethod,
    array: true,
    nullable: true,
  })
  methods!: CourseMethod[] | null

  @Column({
    name: 'schedules',
    type: 'jsonb',
    nullable: true,
  })
  schedules!: CourseSchedule[] | null

  @ManyToMany((type) => Tag)
  @JoinTable({
    name: 'registered_course_tags',
    joinColumn: {
      name: 'registered_course',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag',
      referencedColumnName: 'id',
    },
  })
  tags!: Tag[]
}
