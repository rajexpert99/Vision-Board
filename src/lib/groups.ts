import { createClient } from '@/lib/supabase/client'
import type { Group } from '@/lib/types'

const supabase = createClient()

/**
 * Create a new group from selected cards.
 */
export async function createGroup(
  boardId: string,
  userId: string,
  name: string,
  color: string,
  cardIds: string[],
  camera: { x: number; y: number; zoom: number }
): Promise<Group | null> {
  // Create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      board_id: boardId,
      user_id: userId,
      name,
      color,
      camera_x: camera.x,
      camera_y: camera.y,
      camera_zoom: camera.zoom,
    })
    .select()
    .single()

  if (groupError || !group) {
    console.error('Create group error:', groupError)
    return null
  }

  // Update cards to belong to this group
  if (cardIds.length > 0) {
    const { error: updateError } = await supabase
      .from('cards')
      .update({ group_id: group.id })
      .in('id', cardIds)

    if (updateError) {
      console.error('Update cards group error:', updateError)
    }
  }

  return group as Group
}

/**
 * Remove a card from its group.
 */
export async function removeFromGroup(cardId: string): Promise<void> {
  await supabase
    .from('cards')
    .update({ group_id: null })
    .eq('id', cardId)
}

/**
 * Delete a group (cards stay, just lose their group_id).
 */
export async function deleteGroup(groupId: string): Promise<void> {
  await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)
}

/**
 * Rename a group.
 */
export async function renameGroup(groupId: string, name: string): Promise<void> {
  await supabase
    .from('groups')
    .update({ name })
    .eq('id', groupId)
}

/**
 * Update the group's saved camera position.
 */
export async function updateGroupCamera(
  groupId: string,
  camera: { x: number; y: number; zoom: number }
): Promise<void> {
  await supabase
    .from('groups')
    .update({
      camera_x: camera.x,
      camera_y: camera.y,
      camera_zoom: camera.zoom,
    })
    .eq('id', groupId)
}

/**
 * Fetch all groups for a board.
 */
export async function fetchGroups(boardId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Fetch groups error:', error)
    return []
  }

  return (data || []) as Group[]
}
