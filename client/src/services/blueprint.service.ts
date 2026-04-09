import api from './api'
import type { BlueprintDto, CreateBlueprintDto, UpdateBlueprintDto } from '../types'

export const BlueprintService = {
  findAll: () => api.get<BlueprintDto[]>('/blueprints').then(r => r.data),
  findOne: (id: string) => api.get<BlueprintDto>(`/blueprints/${id}`).then(r => r.data),
  create: (dto: CreateBlueprintDto) => api.post<BlueprintDto>('/blueprints', dto).then(r => r.data),
  update: (id: string, dto: UpdateBlueprintDto) => api.put<BlueprintDto>(`/blueprints/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/blueprints/${id}`),
}
