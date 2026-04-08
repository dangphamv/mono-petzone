import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export function throwOnSupabaseError(error: { code?: string; message: string }, entityName: string): never {
  if (error.code === 'PGRST116') throw new NotFoundException(`${entityName} not found`);
  if (error.code === '23505') throw new ConflictException(`${entityName} already exists`);
  throw new BadRequestException(error.message);
}
