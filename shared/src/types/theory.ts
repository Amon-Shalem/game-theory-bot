export interface TheoryDto {
  id: string
  name: string
  promptFragment: string
  isPreset: boolean
  tags: string[]
  createdAt: string
}

export interface CreateTheoryDto {
  name: string
  promptFragment: string
  tags?: string[]
}

export interface UpdateTheoryDto {
  name?: string
  promptFragment?: string
  tags?: string[]
}
