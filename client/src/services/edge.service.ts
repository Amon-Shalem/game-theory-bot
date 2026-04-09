import api from './api'
import type { EdgeDto, CreateEdgeDto, UpdateEdgeDto } from '../types'

export const EdgeService = {
  findByBlueprint: (blueprintId: string) =>
    api.get<EdgeDto[]>('/edges', { params: { blueprintId } }).then(r => r.data),
  create: (dto: CreateEdgeDto) => api.post<EdgeDto>('/edges', dto).then(r => r.data),
  update: (id: string, dto: UpdateEdgeDto) => api.put<EdgeDto>(`/edges/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/edges/${id}`),
}
