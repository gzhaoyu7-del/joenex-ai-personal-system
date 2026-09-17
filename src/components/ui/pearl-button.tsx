import React from 'react'

type PearlButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string
  endIcon?: React.ReactNode
}

export const PearlButton: React.FC<PearlButtonProps> = ({
  label = 'Pearl Button',
  endIcon,
  className = '',
  ...props
}) => {
  return (
    <>
      <style>{`
        .pearl-button {
          --white: #ffe7ff;
          --bg: #080808;
          --radius: 100px;
          outline: none;
          cursor: pointer;
          border: 0;
          position: relative;
          border-radius: var(--radius);
          background-color: var(--bg);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow:
            inset 0 0.2rem 0.65rem rgba(255, 255, 255, 0.1),
            inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.82),
            inset 0 -0.28rem 0.7rem rgba(255, 255, 255, 0.14),
            0 3rem 3rem rgba(0, 0, 0, 0.3),
            0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
        }
        .pearl-button .wrap {
          width: 100%;
          height: 100%;
          padding: 0 18px;
          display: flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.7);
          border-radius: inherit;
          position: relative;
          overflow: hidden;
        }
        .pearl-button .wrap p > span:nth-child(2) {
          display: none;
        }
        .pearl-button:not(:disabled):hover .wrap p > span:nth-child(1) {
          display: none;
        }
        .pearl-button:not(:disabled):hover .wrap p > span:nth-child(2) {
          display: inline-block;
        }
        .pearl-button .wrap p {
          position: relative;
          z-index: 1;
          width: 100%;
          display: grid;
          grid-template-columns: 18px 1fr 18px;
          align-items: center;
          gap: 8px;
          margin: 0;
          transition: transform 0.2s ease;
          transform: translateY(2%);
          -webkit-mask-image: linear-gradient(to bottom, white 48%, rgba(255,255,255,.72) 82%, transparent 132%);
                  mask-image: linear-gradient(to bottom, white 48%, rgba(255,255,255,.72) 82%, transparent 132%);
        }
        .pearl-button .wrap p > span:first-child,
        .pearl-button .wrap p > span:nth-child(2) {
          grid-column: 1;
          grid-row: 1;
          font-size: 15px;
          line-height: 1;
        }
        .pearl-button .pearl-label {
          grid-column: 2;
          text-align: center;
        }
        .pearl-button .pearl-end {
          grid-column: 3;
          display: grid;
          place-items: center;
        }
        .pearl-button .wrap::before,
        .pearl-button .wrap::after {
          content: '';
          position: absolute;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .pearl-button .wrap::before {
          left: -15%;
          right: -15%;
          bottom: 25%;
          top: -100%;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.055);
        }
        .pearl-button .wrap::after {
          left: 6%;
          right: 6%;
          top: 12%;
          bottom: 40%;
          border-radius: 22px 22px 0 0;
          box-shadow: inset 0 10px 8px -10px rgba(255, 255, 255, 0.38);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.14) 0%,
            rgba(0, 0, 0, 0) 50%,
            rgba(0, 0, 0, 0) 100%
          );
        }
        .pearl-button:not(:disabled):hover {
          box-shadow:
            inset 0 0.25rem 0.55rem rgba(255, 255, 255, 0.16),
            inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.82),
            inset 0 -0.32rem 0.75rem rgba(255, 255, 255, 0.22),
            0 3rem 3rem rgba(0, 0, 0, 0.3),
            0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
        }
        .pearl-button:not(:disabled):hover .wrap::before { transform: translateY(-5%); }
        .pearl-button:not(:disabled):hover .wrap::after { opacity: 0.42; transform: translateY(5%); }
        .pearl-button:not(:disabled):hover .wrap p { transform: translateY(-4%); }
        .pearl-button:not(:disabled):active {
          transform: translateY(4px);
          box-shadow:
            inset 0 0.25rem 0.5rem rgba(255, 255, 255, 0.14),
            inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8),
            inset 0 -0.3rem 0.72rem rgba(255, 255, 255, 0.11),
            0 3rem 3rem rgba(0, 0, 0, 0.3),
            0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
        }
      `}</style>

      <button className={`pearl-button ${className}`} {...props}>
        <div className="wrap">
          <p>
            <span aria-hidden="true">✧</span>
            <span aria-hidden="true">✦</span>
            <strong className="pearl-label">{label}</strong>
            <i className="pearl-end" aria-hidden="true">{endIcon}</i>
          </p>
        </div>
      </button>
    </>
  )
}
