import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { BlueprintService } from './blueprint.service'
import { CreateBlueprintDto, UpdateBlueprintDto } from '@game-theory-bot/shared'

@Controller('blueprints')
export class BlueprintController {
  constructor(private readonly service: BlueprintService) {}

  @Get()
  findAll() { return this.service.findAll() }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  create(@Body() dto: CreateBlueprintDto) { return this.service.create(dto) }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlueprintDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
