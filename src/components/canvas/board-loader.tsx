'use client'

import dynamic from 'next/dynamic'
import type { Card, Group } from '@/lib/types'

const BoardCanvas = dynamic(
  () => import('@/components/canvas/board-canvas').then((mod) => mod.BoardCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
          color: '#6b6b6b',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        }}
      >
        Loading Board…
      </div>
    ),
  }
)

interface BoardLoaderProps {
  boardId: string
  userId: string
  initialCards: Card[]
  initialGroups: Group[]
}

export function BoardLoader({
  boardId,
  userId,
  initialCards,
  initialGroups,
}: BoardLoaderProps) {
  return (
    <BoardCanvas
      boardId={boardId}
      userId={userId}
      initialCards={initialCards}
      initialGroups={initialGroups}
    />
  )
}
