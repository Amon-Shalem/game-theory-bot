import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { EdgeService } from './edge.service'
import { CreateEdgeDto, UpdateEdgeDto } from '@game-theory-bot/shared'

@Controller('edges')
export class EdgeController {
  constructor(private readonly service: EdgeService) {}

  @Get()
  findByBlueprint(@Query('blueprintId') blueprintId: string) {
    return this.service.findByBlueprint(blueprintId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  create(@Body() dto: CreateEdgeDto) { return this.service.create(dto) }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEdgeDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
