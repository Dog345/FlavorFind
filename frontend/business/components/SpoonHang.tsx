/* SpoonHang — hangs from the vertical centre line of the section (between columns) */

interface Props { gradId: string }

export default function SpoonHang({ gradId }: Props) {
  return (
    <div className="hang-wrap">
      {/* spoon SVG: nail at top, handle down, bowl opens downward holding the video */}
      <svg
        className="hang-spoon"
        width="60" height="130"
        viewBox="0 0 60 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* nail head */}
        <rect x="24" y="1"  width="12" height="5"  rx="2.5" fill="#e3c477"/>
        {/* nail shaft */}
        <rect x="28" y="0"  width="4"  height="12" rx="2"   fill="#c8a84b"/>
        {/* handle */}
        <rect x="27" y="10" width="6"  height="65" rx="3"   fill={`url(#${gradId})`}/>
        {/* neck */}
        <path
          d="M27 75 Q24 88 22 98 Q20 106 20 112 Q20 124 30 128 Q40 124 40 112 Q40 106 38 98 Q36 88 33 75 Z"
          fill={`url(#${gradId})`}
        />
        {/* bowl shine */}
        <ellipse cx="30" cy="117" rx="9" ry="7" fill="white" opacity="0.12"/>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e8d080"/>
            <stop offset="50%"  stopColor="#c8a84b"/>
            <stop offset="100%" stopColor="#9a6e20"/>
          </linearGradient>
        </defs>
      </svg>

      {/* video card hangs from bowl */}
      <div className="hang-video">
        <video
          autoPlay muted loop playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  )
}
