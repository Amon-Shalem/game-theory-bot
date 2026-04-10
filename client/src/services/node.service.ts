import api from './api'
import type { NodeDto, CreateNodeDto, UpdateNodeDto, NodePositionItem } from '../types'

export const NodeService = {
  findByBlueprint: (blueprintId: string) =>
    api.get<NodeDto[]>('/nodes', { params: { blueprintId } }).then(r => r.data),
  create: (dto: CreateNodeDto) => api.post<NodeDto>('/nodes', dto).then(r => r.data),
  update: (id: string, dto: UpdateNodeDto) => api.put<NodeDto>(`/nodes/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/nodes/${id}`),
  /**
   * 批次更新節點 Canvas 位置
   * @param items - 要更新的節點 ID 與位置列表
   * @returns 更新後的節點列表
   */
  updatePositions: (items: NodePositionItem[]) =>
    api.patch<NodeDto[]>('/nodes/positions', items).then(r => r.data),
}
