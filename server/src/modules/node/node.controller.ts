import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { NodeService } from './node.service'
import { CreateNodeDto, UpdateNodeDto, UpdateNodePositionsDto } from '@game-theory-bot/shared'

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

  /**
   * 批次更新節點 Canvas 位置
   * 靜態路由 'positions' 須定義在動態路由 ':id' 之前，以確保 NestJS 路由優先匹配正確
   */
  @Patch('positions')
  updatePositions(@Body() dto: UpdateNodePositionsDto) {
    return this.service.updatePositions(dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
