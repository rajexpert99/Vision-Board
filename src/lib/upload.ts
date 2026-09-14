import { createClient } from '@/lib/supabase/client'
import type { Card } from '@/lib/types'

const supabase = createClient()

/**
 * Upload a file to Supabase Storage and create a card record.
 * Returns the created card.
 */
export async function uploadFileAndCreateCard(
  file: File,
  boardId: string,
  userId: string,
  position: { x: number; y: number },
  onProgress?: (percent: number) => void
): Promise<Card | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('card-files')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  // Simulate progress since Supabase JS client doesn't have granular progress
  onProgress?.(50)

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return null
  }

  onProgress?.(80)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('card-files')
    .getPublicUrl(storagePath)

  const contentUrl = urlData.publicUrl

  // Determine card type
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(file.name)
  const cardType = isImage ? 'image' : 'file'

  // Calculate default expiry (30 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Determine dimensions
  const width = isImage ? 260 : 180
  const height = isImage ? 220 : 160

  // Create card record
  const { data, error: dbError } = await supabase
    .from('cards')
    .insert({
      board_id: boardId,
      user_id: userId,
      type: cardType,
      content_url: contentUrl,
      title: file.name,
      x: position.x,
      y: position.y,
      width,
      height,
      expires_at: expiresAt.toISOString(),
      is_permanent: false,
    })
    .select()
    .single()

  onProgress?.(100)

  if (dbError) {
    console.error('DB error:', dbError)
    return null
  }

  return data as Card
}

/**
 * Get a signed URL for a private file in Supabase Storage.
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('card-files')
    .createSignedUrl(path, 3600) // 1 hour

  if (error) {
    console.error('Signed URL error:', error)
    return null
  }

  return data.signedUrl
}
