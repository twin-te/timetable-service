import { Column, Entity, PrimaryColumn, Unique } from 'typeorm'

@Entity({ name: 'tagColor' })
@Unique(['tag_id'], { deferrable: 'INITIALLY DEFERRED' })
export class TagColor {
  @PrimaryColumn({
    name: 'tag_id',
    type: 'uuid',
  })
  tagId!: string

  @Column({
    name: 'color_hex',
    type: 'string',
  })
  colorHex!: string

  @Column({
    name: 'color_id',
    type: 'string',
  })
  colorId!: string
}
