import type { AnswerRecord, QuizChallenge, QuizMode } from '../types'
import { getFlagUrl } from '../utils/flagUrl'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

interface ResultScreenProps {
  answers: AnswerRecord[]
  score: number
  totalQuestions: number
  mode: QuizMode
  challenge: QuizChallenge
  onRestart: () => void
}

function getGrade(score: number, total: number): {
  label: string
  color: 'green' | 'blue' | 'gray' | 'red'
} {
  const pct = total > 0 ? score / total : 0
  if (pct >= 0.9) return { label: '🏆 Excellent!', color: 'green' }
  if (pct >= 0.7) return { label: '👍 Good job!', color: 'blue' }
  if (pct >= 0.5) return { label: '📚 Not bad', color: 'gray' }
  return { label: '💪 Keep practicing', color: 'red' }
}

export function ResultScreen({
  answers,
  score,
  totalQuestions,
  mode,
  challenge,
  onRestart,
}: ResultScreenProps) {
  const { label, color } = getGrade(score, totalQuestions)
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const wrong = answers.filter(a => a.status === 'incorrect')
  const isSimilar = challenge === 'similar-flags'
  const isHidden = mode === 'hidden-flag'

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Score summary */}
      <div className="text-center mb-8">
        <div
          className={`text-6xl font-extrabold mb-1 ${
            pct >= 70 ? 'text-blue-600' : 'text-slate-700'
          }`}
        >
          {pct}%
        </div>
        <p className="text-lg font-semibold text-slate-600 mb-3">
          {score} / {totalQuestions} correct
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge label={label} color={color} />
          {isSimilar && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
              Similar Flags Challenge
            </span>
          )}
          {isHidden && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-900 text-white">
              Hidden Flag Challenge
            </span>
          )}
        </div>
      </div>

      {/* Missed flags review */}
      {wrong.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Flags to review ({wrong.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wrong.map(record => {
              const pickedCountry = record.question.options.find(
                o => o.code === record.selectedCode
              )
              return (
                <div
                  key={record.question.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  {/* Same object-contain strategy as FlagOption — no cropping */}
                  <div className="bg-slate-50 aspect-[3/2] p-2">
                    <img
                      src={getFlagUrl(record.question.correct.code, 320)}
                      alt={record.question.correct.name}
                      className="w-full h-full object-contain drop-shadow-sm"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {record.question.correct.name}
                    </p>
                    {pickedCountry && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">
                        You chose: {pickedCountry.name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <Button size="lg" onClick={onRestart} className="w-full">
        Play Again
      </Button>
    </div>
  )
}
