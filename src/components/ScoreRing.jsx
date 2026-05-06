import React from 'react'

export default function ScoreRing({ score, maxScore = 100, color = '#C4920A', size = 110, label = '/ 100' }) {
 const r = (size / 2) - 8
 const circ = 2 * Math.PI * r
 const offset = circ - (score / maxScore) * circ

 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score: ${score} out of ${maxScore}`}>
 {/* Track */}
 <circle
 cx={size / 2} cy={size / 2} r={r}
 fill="none" stroke="rgba(16,15,13,0.08)" strokeWidth="10"
 />
 {/* Fill */}
 <circle
 cx={size / 2} cy={size / 2} r={r}
 fill="none" stroke={color} strokeWidth="10"
 strokeDasharray={circ}
 strokeDashoffset={offset}
 strokeLinecap="butt"
 transform={`rotate(-90 ${size/2} ${size/2})`}
 className="ring-transition"
 />
 {/* Score text */}
 <text
 x={size / 2} y={size / 2 - 4}
 textAnchor="middle"
 style={{ fontFamily: '"PP Editorial New", Georgia, serif', fontWeight: 800, fontStyle: '', fontSize: size * 0.26, letterSpacing: '-0.02em', fill: color }}
 >
 {score}
 </text>
 <text
 x={size / 2} y={size / 2 + size * 0.16}
 textAnchor="middle"
 style={{ fontFamily: '"Source Serif 4", Georgia, serif', fontStyle: '', fontSize: size * 0.1, fill: '#A8A098' }}
 >
 {label}
 </text>
 </svg>
 )
}
