import api from './api'
import type { NodeDto, CreateNodeDto, UpdateNodeDto } from '../types'

export const NodeService = {
  findByBlueprint: (blueprintId: string) =>
    api.get<NodeDto[]>('/nodes', { params: { blueprintId } }).then(r => r.data),
  create: (dto: CreateNodeDto) => api.post<NodeDto>('/nodes', dto).then(r => r.data),
  update: (id: string, dto: UpdateNodeDto) => api.put<NodeDto>(`/nodes/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/nodes/${id}`),
}
