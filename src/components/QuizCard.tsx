import { useMemo, useState } from 'react'
import type { Question, AnswerRecord, QuizChallenge, QuizMode } from '../types'
import { getFlagUrl } from '../utils/flagUrl'
import { generateHiddenFlagReveal } from '../utils/hiddenFlagReveal'
import { FlagGrid } from './FlagGrid'
import { NameGrid } from './NameGrid'

interface QuizCardProps {
  question: Question
  answerRecord: AnswerRecord | undefined
  onAnswer: (code: string) => void
  questionNumber: number
  totalQuestions: number
  mode: QuizMode
  challenge: QuizChallenge
}

// ── Mode-specific prompt components ──────────────────────────────────────────
// Separating prompt from options makes it easy to add new modes:
// add a prompt component here + a grid component, wire in the switch below.

function NamePrompt({ name }: { name: string }) {
  return (
    <>
      <h2 className="text-xl font-medium text-slate-500 mb-1">
        Which flag belongs to
      </h2>
      <p className="text-3xl sm:text-4xl font-extrabold text-slate-800">
        {name}
      </p>
      <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">?</p>
    </>
  )
}

function FlagPrompt({ code, isAnswered, correctName }: {
  code: string
  isAnswered: boolean
  correctName: string
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]   = useState(false)

  // w640 is the next valid CDN size above w320 and gives a sharper prompt image.
  // getFlagUrl enforces 160 | 320 | 640 at the type level — any other value is a
  // compile error, which is what caught the original bug (480 was passed here).
  const src = getFlagUrl(code, 640)

  return (
    <>
      <h2 className="text-xl font-medium text-slate-500 mb-4">
        Which country does this flag belong to?
      </h2>
      {/* Flag display — same object-contain + padded-frame approach as FlagOption,
          but larger and centered. max-w-xs at 3:2 aspect = ~213px tall. */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-xs bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="aspect-[3/2] p-3">
            {/* Skeleton — full-bleed, removed once image loads */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}

            {imgError ? (
              /* Fallback: show ISO code when CDN returns an error */
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-mono uppercase tracking-widest">
                {code}
              </div>
            ) : (
              <img
                src={src}
                alt={isAnswered ? `Flag of ${correctName}` : 'Flag — which country is this?'}
                className={`
                  w-full h-full object-contain drop-shadow-sm
                  transition-opacity duration-300
                  ${imgLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true) }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function HiddenFlagPrompt({ code, isAnswered, correctName, questionId }: {
  code: string
  isAnswered: boolean
  correctName: string
  questionId: string
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]   = useState(false)
  const reveal = useMemo(() => generateHiddenFlagReveal('medium'), [questionId])
  const src = getFlagUrl(code, 640)
  const revealStyle = {
    left: `${reveal.x}%`,
    top: `${reveal.y}%`,
    width: `${reveal.size}%`,
    height: `${reveal.size}%`,
  }

  return (
    <>
      <h2 className="text-xl font-medium text-slate-300 mb-4">
        Which country is hiding behind the mask?
      </h2>
      <div className="flex justify-center">
        <div className="relative w-full max-w-sm rounded-2xl border border-slate-800/20 bg-slate-950 shadow-xl shadow-slate-900/20 overflow-hidden">
          <div className="aspect-[3/2] p-3">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-800 animate-pulse" />
            )}

            {imgError ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-mono uppercase tracking-widest">
                {code}
              </div>
            ) : (
              <img
                src={src}
                alt={isAnswered ? `Flag of ${correctName}` : 'Mostly hidden flag'}
                className={`
                  w-full h-full object-contain drop-shadow-sm
                  transition-opacity duration-300
                  ${imgLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true) }}
              />
            )}

            <div
              className={`
                pointer-events-none absolute inset-3 overflow-hidden bg-transparent
                transition-opacity duration-500 ease-out
                ${isAnswered ? 'opacity-0' : 'opacity-100'}
              `}
              aria-hidden="true"
            >
              <div
                className="absolute left-0 right-0 top-0 bg-black"
                style={{ height: `${reveal.y}%` }}
              />
              <div
                className="absolute left-0 bg-black"
                style={{
                  top: `${reveal.y}%`,
                  width: `${reveal.x}%`,
                  height: `${reveal.size}%`,
                }}
              />
              <div
                className="absolute right-0 bg-black"
                style={{
                  top: `${reveal.y}%`,
                  left: `${reveal.x + reveal.size}%`,
                  height: `${reveal.size}%`,
                }}
              />
              <div
                className="absolute left-0 right-0 bottom-0 bg-black"
                style={{ top: `${reveal.y + reveal.size}%` }}
              />
              <div
                className="absolute ring-1 ring-white/35 shadow-[0_0_0_9999px_rgba(0,0,0,0)]"
                style={revealStyle}
              />
            </div>

            <div
              className={`
                pointer-events-none absolute inset-3 rounded-lg ring-1 ring-white/10
                shadow-[inset_0_0_60px_rgba(0,0,0,0.75)]
                transition-opacity duration-500
                ${isAnswered ? 'opacity-0' : 'opacity-100'}
              `}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
        {Math.round(reveal.visibleRatio * 100)}% visible
      </p>
    </>
  )
}

export function QuizCard({
  question,
  answerRecord,
  onAnswer,
  questionNumber,
  totalQuestions,
  mode,
  challenge,
}: QuizCardProps) {
  const isAnswered = answerRecord !== undefined
  const isSimilar = challenge === 'similar-flags'
  const isHidden = mode === 'hidden-flag'

  return (
    <div className="w-full max-w-2xl mx-auto">
      {isHidden && (
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/10 shadow-lg shadow-slate-900/20">
            Hidden Flag Challenge
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-slate-900">
              Masked
            </span>
          </span>
        </div>
      )}

      {isSimilar && (
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            Similar Flags Challenge
            <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] text-white">
              Hard
            </span>
          </span>
        </div>
      )}

      {/* Progress label */}
      <p className={`text-xs font-semibold uppercase tracking-widest text-center mb-3 ${
        isHidden ? 'text-slate-300' : isSimilar ? 'text-amber-500' : 'text-slate-400'
      }`}>
        Question {questionNumber} of {totalQuestions}
      </p>

      {/* Mode-specific prompt */}
      <div className="text-center mb-6">
        {mode === 'name-to-flag' && (
          <NamePrompt name={question.correct.name} />
        )}
        {mode === 'flag-to-name' && (
          <FlagPrompt
            code={question.correct.code}
            isAnswered={isAnswered}
            correctName={question.correct.name}
          />
        )}
        {mode === 'hidden-flag' && (
          <HiddenFlagPrompt
            code={question.correct.code}
            isAnswered={isAnswered}
            correctName={question.correct.name}
            questionId={question.id}
          />
        )}
      </div>

      {/* Mode-specific options grid */}
      {mode === 'name-to-flag' && (
        <FlagGrid
          options={question.options}
          correctCode={question.correct.code}
          selectedCode={answerRecord?.selectedCode ?? null}
          onSelect={onAnswer}
        />
      )}
      {mode === 'flag-to-name' && (
        <NameGrid
          options={question.options}
          correctCode={question.correct.code}
          selectedCode={answerRecord?.selectedCode ?? null}
          onSelect={onAnswer}
        />
      )}
      {mode === 'hidden-flag' && (
        <NameGrid
          options={question.options}
          correctCode={question.correct.code}
          selectedCode={answerRecord?.selectedCode ?? null}
          onSelect={onAnswer}
        />
      )}

      {/* Feedback — same copy for both modes */}
      {answerRecord && (
        <p
          className={`
            text-center mt-4 text-sm font-semibold
            ${answerRecord.status === 'correct' ? 'text-green-600' : 'text-red-500'}
          `}
        >
          {answerRecord.status === 'correct'
            ? 'Correct! Moving on...'
            : `The correct answer was ${question.correct.name}`}
        </p>
      )}
    </div>
  )
}
