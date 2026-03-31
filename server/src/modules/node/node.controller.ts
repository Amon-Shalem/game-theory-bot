import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { NodeService } from './node.service'
import { CreateNodeDto, UpdateNodeDto } from '@game-theory-bot/shared'

@Controller('nodes')
export class NodeController {
  constructor(private readonly service: NodeService) {}

  @Get()
  findByBlueprint(@Query('blueprintId') blueprintId: string) {
    return this.service.findByBlueprint(blueprintId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  create(@Body() dto: CreateNodeDto) { return this.service.create(dto) }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNodeDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
