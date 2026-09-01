'use client'

import { useEffect, useRef } from 'react'

const STEPS = [
  {
    num: '01',
    title: 'Add what you have',
    body:  'Type in ingredients — as few as one, as many as your whole shelf.',
  },
  {
    num: '02',
    title: 'We match the flavor',
    body:  'Our engine ranks recipes by what genuinely fits, not just what\'s popular.',
  },
  {
    num: '03',
    title: 'Cook & save it',
    body:  'Follow along, then bookmark it for the next time you\'re stuck.',
  },
]

export default function HowItWorks() {
  const headRef  = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.25 }
    )
    if (headRef.current)  observer.observe(headRef.current)
    if (stepsRef.current) observer.observe(stepsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="how" className="how-section how-section-offset">
      <div className="how-content">
        <div ref={headRef} className="section-head reveal">
          <span className="eyebrow">How We Do Things</span>
          <h2>From Fridge to Table in Three Steps</h2>
        </div>

        <div ref={stepsRef} className="how-steps reveal-stagger">
          {STEPS.map(s => (
            <div key={s.num} className="how-step">
              <span className="step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
