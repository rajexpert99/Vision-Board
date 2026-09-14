import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type RecordProps,
  type TLShape,
} from 'tldraw'

// ============================================================
// Link Card Shape
// ============================================================

const LINK_SHAPE_TYPE = 'board-card-link' as const

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    [LINK_SHAPE_TYPE]: {
      w: number
      h: number
      cardId: string
      linkUrl: string
      title: string
      description: string
      previewImage: string
      siteName: string
      groupColor: string
      isPermanent: boolean
      expiresAt: string
    }
  }
}

export type LinkCardShape = TLShape<typeof LINK_SHAPE_TYPE>

export class LinkCardShapeUtil extends BaseBoxShapeUtil<LinkCardShape> {
  static override type = LINK_SHAPE_TYPE as string
  static override props: RecordProps<LinkCardShape> = {
    w: T.number,
    h: T.number,
    cardId: T.string,
    linkUrl: T.string,
    title: T.string,
    description: T.string,
    previewImage: T.string,
    siteName: T.string,
    groupColor: T.string,
    isPermanent: T.boolean,
    expiresAt: T.string,
  }

  getDefaultProps(): LinkCardShape['props'] {
    return {
      w: 260,
      h: 200,
      cardId: '',
      linkUrl: '',
      title: '',
      description: '',
      previewImage: '',
      siteName: '',
      groupColor: '',
      isPermanent: false,
      expiresAt: '',
    }
  }

  component(shape: LinkCardShape) {
    const { linkUrl, title, description, previewImage, siteName, groupColor, isPermanent, expiresAt } =
      shape.props
    const isExpiringSoon = expiresAt && !isPermanent && isWithinDays(expiresAt, 3)
    const domain = linkUrl ? extractDomain(linkUrl) : ''

    const handleOpenLink = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (linkUrl) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer')
      }
    }

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
          style={{
            '--card-group-color': groupColor || undefined,
            cursor: 'pointer',
            height: '100%',
          } as React.CSSProperties}
          onDoubleClick={handleOpenLink}
        >
          <div className="board-card-link">
            {previewImage && (
              <div className="board-card-link-image">
                <img src={previewImage} alt={title || 'Link preview'} loading="lazy" />
              </div>
            )}
            <div className="board-card-link-body">
              <div className="board-card-link-title" title={title || linkUrl}>
                {title || linkUrl || 'Link'}
              </div>
              {description && <div className="board-card-link-desc">{description}</div>}
              <div className="board-card-link-domain">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {siteName || domain}
                <span
                  onClick={handleOpenLink}
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    color: 'var(--canva-purple, #7d2ae8)',
                    textDecoration: 'underline',
                  }}
                  title="Open link in new tab"
                >
                  Open ↗
                </span>
              </div>
            </div>
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

  override getIndicatorPath(shape: LinkCardShape) {
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

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function isWithinDays(dateStr: string, days: number): boolean {
  if (!dateStr) return false
  const expiry = new Date(dateStr).getTime()
  const now = Date.now()
  const diff = expiry - now
  return diff > 0 && diff < days * 24 * 60 * 60 * 1000
}
