// ============================================================
// Board — Shared Types
// ============================================================

export type CardType = 'image' | 'file' | 'link' | 'note'

export interface Board {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface BoardMember {
  id: string
  board_id: string
  user_id: string | null
  email: string
  role: 'editor' | 'viewer'
  created_at: string
}

export interface Card {
  id: string
  board_id: string
  user_id: string
  type: CardType
  content_url: string | null
  link_url: string | null
  title: string | null
  preview_image_url: string | null
  text_content: string | null
  x: number
  y: number
  width: number
  height: number
  group_id: string | null
  created_at: string
  expires_at: string | null
  is_permanent: boolean
}

export interface Group {
  id: string
  board_id: string
  user_id: string
  name: string
  color: string
  camera_x: number
  camera_y: number
  camera_zoom: number
  created_at: string
}

export interface OGMetadata {
  ogTitle?: string
  ogDescription?: string
  ogImage?: Array<{ url: string }> | string
  ogSiteName?: string
  ogUrl?: string
  requestUrl?: string
}

export interface UnfurlResult {
  title: string
  description: string
  image: string | null
  siteName: string
  url: string
}
