import { IsUUID } from 'class-validator'

/**
 * Generic DTO to ensure entities expose a UUID identifier.
 */
export class BaseIdDto {
  @IsUUID()
  id!: string
}
