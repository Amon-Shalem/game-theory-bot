import api from './api'
import type { TheoryDto, CreateTheoryDto, UpdateTheoryDto } from '../types'

/** 理論服務 — 封裝 /theories API */
export const TheoryService = {
  async findAll(): Promise<TheoryDto[]> {
    const res = await api.get<TheoryDto[]>('/theories')
    return res.data
  },

  async create(dto: CreateTheoryDto): Promise<TheoryDto> {
    const res = await api.post<TheoryDto>('/theories', dto)
    return res.data
  },

  async update(id: string, dto: UpdateTheoryDto): Promise<TheoryDto> {
    const res = await api.put<TheoryDto>(`/theories/${id}`, dto)
    return res.data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/theories/${id}`)
  },
}
