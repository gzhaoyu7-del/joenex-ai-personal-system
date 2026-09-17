interface CardGradientSurfaceProps {
  active?: boolean
}

/**
 * Decorative colour field for archive cards. It stays behind the content so
 * the card can keep crisp, native text instead of rasterising the whole panel.
 */
export function CardGradientSurface({ active = false }: CardGradientSurfaceProps) {
  return (
    <span
      className={`card-gradient-surface ${active ? 'is-active' : ''}`}
      aria-hidden="true"
    >
      <i className="card-gradient-surface__flare card-gradient-surface__flare--cool" />
      <i className="card-gradient-surface__flare card-gradient-surface__flare--warm" />
    </span>
  )
}
