// src/types/index.ts

export interface Article {
    id: string
    title: string
    desc: string
    categoryId?: string 
    views?: number
    author?: string
    date?: string
}
  