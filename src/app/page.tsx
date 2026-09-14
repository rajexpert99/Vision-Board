import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardLoader } from '@/components/canvas/board-loader'
import type { Card, Group, Board } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the user's own board or shared boards
  let { data: boards, error: selectError } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true })

  if (selectError) {
    console.error('Error fetching boards from Supabase:', selectError)
    return (
      <div style={{ padding: '2rem', color: '#f87171', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Database Setup Required</h2>
        <p>Could not query the <code>boards</code> table in your Supabase project.</p>
        <p><strong>Error:</strong> {selectError.message}</p>
        <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />
        <h3>How to Fix:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Go to your Supabase Dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>supabase.com/dashboard</a></li>
          <li>Select your project (<strong>rbcqzghifngxpqqcknmx</strong>)</li>
          <li>Click on <strong>SQL Editor</strong> on the left menu</li>
          <li>Paste and execute the script in <a href="file:///c:/Users/wildy/OneDrive/Desktop/Web%20rebbids/files%20sharing%20board/board-app/supabase/schema.sql" style={{ color: '#38bdf8' }}>supabase/schema.sql</a></li>
        </ol>
      </div>
    )
  }

  let board: Board

  if (!boards || boards.length === 0) {
    // Create a default board
    const { data: newBoard, error } = await supabase
      .from('boards')
      .insert({ user_id: user.id, name: 'My Board' })
      .select()
      .single()

    if (error || !newBoard) {
      console.error('Error creating board in Supabase:', error)
      return (
        <div style={{ padding: '2rem', color: '#f87171', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2>Database Setup Required</h2>
          <p>Could not load or create a board in your Supabase project.</p>
          <p><strong>Error:</strong> {error?.message || 'Failed to create board record'}</p>
          <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />
          <h3>How to Fix:</h3>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Go to your Supabase Dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>supabase.com/dashboard</a></li>
            <li>Select your project (<strong>rbcqzghifngxpqqcknmx</strong>)</li>
            <li>Go to the <strong>SQL Editor</strong> tab on the left sidebar</li>
            <li>Copy and run the contents of the <code>supabase/schema.sql</code> file from this project to create the required <code>boards</code>, <code>groups</code>, and <code>cards</code> tables.</li>
          </ol>
        </div>
      )
    }
    board = newBoard as Board
  } else {
    board = boards[0] as Board
  }

  // Fetch cards
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('board_id', board.id)
    .order('created_at', { ascending: true })

  // Fetch groups
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('board_id', board.id)
    .order('created_at', { ascending: true })

  return (
    <BoardLoader
      boardId={board.id}
      userId={user.id}
      initialCards={(cards || []) as Card[]}
      initialGroups={(groups || []) as Group[]}
    />
  )
}
