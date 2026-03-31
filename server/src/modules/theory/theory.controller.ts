import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { TheoryService } from './theory.service'
import { CreateTheoryDto, UpdateTheoryDto } from '@game-theory-bot/shared'

@Controller('theories')
export class TheoryController {
  constructor(private readonly service: TheoryService) {}

  @Get() findAll() { return this.service.findAll() }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id) }
  @Post() create(@Body() dto: CreateTheoryDto) { return this.service.create(dto) }
  @Put(':id') update(@Param('id') id: string, @Body() dto: UpdateTheoryDto) { return this.service.update(id, dto) }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.service.remove(id) }
}
