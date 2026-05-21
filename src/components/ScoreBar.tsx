import type { QuizChallenge } from '../types'

interface ScoreBarProps {
  score: number
  answered: number
  total: number
  challenge: QuizChallenge
}

export function ScoreBar({ score, answered, total, challenge }: ScoreBarProps) {
  const progress = total > 0 ? (answered / total) * 100 : 0
  const isSimilar = challenge === 'similar-flags'

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-semibold text-slate-700">
          Score: <span className={isSimilar ? 'text-amber-600' : 'text-blue-600'}>{score}</span>
          <span className="text-slate-400 font-normal"> / {answered}</span>
        </span>
        <span className="text-slate-400 tabular-nums">
          {answered}/{total}
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isSimilar ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  )
}
