/** 藍圖 DTO — 前後端共用 */
export interface BlueprintDto {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface CreateBlueprintDto {
  name: string
  description?: string
}

export interface UpdateBlueprintDto {
  name?: string
  description?: string
}
