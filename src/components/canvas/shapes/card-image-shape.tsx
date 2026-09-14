import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type RecordProps,
  type TLShape,
} from 'tldraw'

// ============================================================
// Image Card Shape
// ============================================================

const IMAGE_SHAPE_TYPE = 'board-card-image' as const

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    [IMAGE_SHAPE_TYPE]: {
      w: number
      h: number
      cardId: string
      imageUrl: string
      title: string
      groupColor: string
      isPermanent: boolean
      expiresAt: string
    }
  }
}

export type ImageCardShape = TLShape<typeof IMAGE_SHAPE_TYPE>

export class ImageCardShapeUtil extends BaseBoxShapeUtil<ImageCardShape> {
  static override type = IMAGE_SHAPE_TYPE as string
  static override props: RecordProps<ImageCardShape> = {
    w: T.number,
    h: T.number,
    cardId: T.string,
    imageUrl: T.string,
    title: T.string,
    groupColor: T.string,
    isPermanent: T.boolean,
    expiresAt: T.string,
  }

  getDefaultProps(): ImageCardShape['props'] {
    return {
      w: 240,
      h: 200,
      cardId: '',
      imageUrl: '',
      title: '',
      groupColor: '',
      isPermanent: false,
      expiresAt: '',
    }
  }

  component(shape: ImageCardShape) {
    const { imageUrl, title, groupColor, isPermanent, expiresAt } = shape.props
    const isExpiringSoon = expiresAt && !isPermanent && isWithinDays(expiresAt, 3)

    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
        }}
      >
        <div
          className={`board-card ${groupColor ? 'grouped' : ''} ${isExpiringSoon ? 'expiring-soon' : ''}`}
          style={{ '--card-group-color': groupColor || undefined } as React.CSSProperties}
        >
          <div className="board-card-image">
            {imageUrl ? (
              <img src={imageUrl} alt={title || 'Image'} loading="lazy" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {title && <div className="board-card-image-title">{title}</div>}
          </div>
          {(isPermanent || isExpiringSoon) && (
            <div className="board-card-meta">
              {isPermanent && <span className="board-card-badge permanent">Pinned</span>}
              {isExpiringSoon && <span className="board-card-badge expiring">Expiring</span>}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  override getIndicatorPath(shape: ImageCardShape) {
    const path = new Path2D()
    const r = 10
    const w = shape.props.w
    const h = shape.props.h
    path.moveTo(r, 0)
    path.lineTo(w - r, 0)
    path.arcTo(w, 0, w, r, r)
    path.lineTo(w, h - r)
    path.arcTo(w, h, w - r, h, r)
    path.lineTo(r, h)
    path.arcTo(0, h, 0, h - r, r)
    path.lineTo(0, r)
    path.arcTo(0, 0, r, 0, r)
    path.closePath()
    return path
  }
}

function isWithinDays(dateStr: string, days: number): boolean {
  if (!dateStr) return false
  const expiry = new Date(dateStr).getTime()
  const now = Date.now()
  const diff = expiry - now
  return diff > 0 && diff < days * 24 * 60 * 60 * 1000
}
