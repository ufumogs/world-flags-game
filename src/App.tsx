import { useEffect, useRef, useState } from 'react'
import { useQuiz } from './hooks/useQuiz'
import { useSound } from './hooks/useSound'
import { StartScreen } from './components/StartScreen'
import { QuizCard } from './components/QuizCard'
import { ResultScreen } from './components/ResultScreen'
import { ScoreBar } from './components/ScoreBar'
import { SoundToggle } from './components/SoundToggle'
import { ConfirmModal } from './components/ConfirmModal'
import { getFlagUrl } from './utils/flagUrl'
import { TIMING } from './utils/timing'
import type { AppScreen, QuizConfig } from './types'

export default function App() {
  const { state, start, answer, next, restart } = useQuiz()
  const { enabled: soundEnabled, toggle: toggleSound, play } = useSound()

  // ── Top-level screen ─────────────────────────────────────────────────────────
  // Separate from quiz's GamePhase — AppScreen owns which UI is visible.
  // Adding a new screen: add it to AppScreen type + one case below. Nothing else changes.
  const [appScreen, setAppScreen] = useState<AppScreen>('menu')

  // 'quit' → user clicked ← Menu mid-quiz
  // 'restart' → user clicked ↺ mid-quiz
  // null → no modal
  const [confirmAction, setConfirmAction] = useState<'quit' | 'restart' | null>(null)

  // Preserves the last config so restart replays the same settings
  const lastConfigRef = useRef<QuizConfig | null>(null)

  // ── Transition state ─────────────────────────────────────────────────────────
  // true  → wrapper fading out (opacity-0, slide up)
  // false → wrapper visible (controlled by .card-enter CSS animation)
  const [isExiting, setIsExiting] = useState(false)

  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimers() {
    if (t1Ref.current) { clearTimeout(t1Ref.current); t1Ref.current = null }
    if (t2Ref.current) { clearTimeout(t2Ref.current); t2Ref.current = null }
  }

  // ── Answer lock ──────────────────────────────────────────────────────────────
  // Guards against double-answers in the gap between a key/click event and the
  // React re-render that makes `currentAnswer` truthy.
  const answerLockRef = useRef(false)

  // Unlock when the question advances so the next question accepts input.
  useEffect(() => {
    answerLockRef.current = false
  }, [state.currentIndex])

  // Ref for complete-sound deduplication across StrictMode double-invocations.
  const completeSoundFiredRef = useRef(false)

  const currentAnswer = state.answers[state.currentIndex]

  // ── Navigation handlers ──────────────────────────────────────────────────────

  function handleStart(config: QuizConfig) {
    lastConfigRef.current = config
    play('click')
    start(config)
    setAppScreen('quiz')
    window.scrollTo({ top: 0 })
  }

  // Hard navigation — clears timers and resets quiz state before switching screens.
  function doGoToMenu() {
    clearTimers()
    setIsExiting(false)
    restart()
    setAppScreen('menu')
    setConfirmAction(null)
  }

  // Soft navigation — shows confirm if the user would lose in-progress answers.
  function handleGoToMenu() {
    if (state.phase === 'playing' && state.answers.length > 0) {
      setConfirmAction('quit')
      return
    }
    doGoToMenu()
  }

  // Hard restart — clears timers, replays the same config.
  function doRestart() {
    clearTimers()
    setIsExiting(false)
    play('click')
    completeSoundFiredRef.current = false
    restart()
    if (lastConfigRef.current) start(lastConfigRef.current)
    setConfirmAction(null)
    window.scrollTo({ top: 0 })
  }

  // Soft restart — shows confirm if the user would lose in-progress answers.
  function handleRestartClick() {
    if (state.phase === 'playing' && state.answers.length > 0) {
      setConfirmAction('restart')
      return
    }
    doRestart()
  }

  // From the ResultScreen — quiz is finished so no progress to lose, no confirm needed.
  function handlePlayAgain() {
    play('click')
    completeSoundFiredRef.current = false
    restart()
    if (lastConfigRef.current) start(lastConfigRef.current)
    window.scrollTo({ top: 0 })
  }

  function handleConfirm() {
    if (confirmAction === 'quit') doGoToMenu()
    else if (confirmAction === 'restart') doRestart()
  }

  // ── Answer handler ───────────────────────────────────────────────────────────
  // Called by both mouse clicks (via FlagGrid) and keyboard (1–4).
  // Plays sound synchronously so there is zero audible delay.
  function handleAnswer(selectedCode: string) {
    if (answerLockRef.current) return
    const question = state.questions[state.currentIndex]
    if (!question || currentAnswer) return

    answerLockRef.current = true
    const isCorrect = selectedCode === question.correct.code
    play(isCorrect ? 'correct' : 'incorrect')
    answer(selectedCode)
  }

  // ── Two-phase transition after answering ─────────────────────────────────────
  //
  // Phase 1 (ANSWER_FEEDBACK_MS = 600ms):
  //   Green/red highlight is fully visible. User reads the result.
  //   → setIsExiting(true): triggers CSS exit transition on the wrapper.
  //
  // Phase 2 (+ CARD_TRANSITION_MS = 150ms):
  //   Exit transition finishes. Card is invisible.
  //   → next() + setIsExiting(false): React swaps content; keyed div remounts;
  //     .card-enter CSS animation fires on the new question.
  useEffect(() => {
    if (!currentAnswer) return

    t1Ref.current = setTimeout(() => {
      setIsExiting(true)

      t2Ref.current = setTimeout(() => {
        // React 18 batches these two updates into one render.
        setIsExiting(false)
        next()
      }, TIMING.CARD_TRANSITION_MS)
    }, TIMING.ANSWER_FEEDBACK_MS)

    return () => {
      if (t1Ref.current) clearTimeout(t1Ref.current)
      if (t2Ref.current) clearTimeout(t2Ref.current)
    }
  }, [currentAnswer, next])

  // ── Complete sound ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'finished' && !completeSoundFiredRef.current) {
      completeSoundFiredRef.current = true
      play('complete')
    }
    if (state.phase !== 'finished') {
      completeSoundFiredRef.current = false
    }
  }, [state.phase, play])

  // ── Preload next question's flag images ─────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'playing') return
    const nextIndex = state.currentIndex + 1
    if (nextIndex < state.questions.length) {
      state.questions[nextIndex].options.forEach(country => {
        const img = new Image()
        img.src = getFlagUrl(country.code)
      })
    }
  }, [state.currentIndex, state.phase, state.questions])

  // ── Keyboard shortcuts: 1 / 2 / 3 / 4 ──────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'playing') return
    const question = state.questions[state.currentIndex]
    if (!question || currentAnswer) return

    function handleKey(e: KeyboardEvent) {
      // Ignore held-down keys — only act on the initial press.
      if (e.repeat) return
      const idx = ['1', '2', '3', '4'].indexOf(e.key)
      if (idx !== -1 && question.options[idx]) {
        handleAnswer(question.options[idx].code)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // handleAnswer intentionally omitted from deps — reads current state via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentIndex, currentAnswer, state.questions])

  // ── Exit transition styles ───────────────────────────────────────────────────
  // Inline styles avoid Tailwind class-conflict between opacity-0 / opacity-100.
  const exitStyle = isExiting
    ? { opacity: 0, transform: 'translateY(-8px) scale(0.97)' }
    : undefined

  // ── Header ───────────────────────────────────────────────────────────────────
  // Three states:
  //   menu         → logo left + sound toggle right
  //   quiz+playing → [← Menu] | ScoreBar (flex-1) | [↺] | SoundToggle
  //   quiz+finished → [← Menu] | SoundToggle

  function renderHeader() {
    if (appScreen === 'menu') {
      // Transparent — the StartScreen hero owns the title on this screen.
      return (
        <header className="sticky top-0 z-10">
          <div className="max-w-sm mx-auto px-4 py-3 flex justify-end">
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          </div>
        </header>
      )
    }

    if (state.phase === 'playing') {
      return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            {/* ← Menu */}
            <button
              onClick={handleGoToMenu}
              aria-label="Back to menu"
              className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Menu
            </button>

            {/* ScoreBar — owns its own layout here */}
            <div className="flex-1 max-w-xs">
              <ScoreBar
                score={state.score}
                answered={state.answers.length}
                total={state.totalQuestions}
                mode={state.mode}
                challenge={state.challenge}
              />
            </div>

            {/* ↺ Restart */}
            <button
              onClick={handleRestartClick}
              aria-label="Restart quiz"
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>

            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          </div>
        </header>
      )
    }

    // quiz + finished
    return (
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={handleGoToMenu}
            aria-label="Back to menu"
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Menu
          </button>
          <div className="ml-auto">
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          </div>
        </div>
      </header>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      appScreen === 'menu'
        ? 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/60'
        : state.phase === 'playing' && state.mode === 'hidden-flag'
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800'
        : state.challenge === 'similar-flags'
          ? 'bg-amber-50'
        : 'bg-slate-100'
    }`}>
      {renderHeader()}

      <main className={`flex-1 flex items-start justify-center p-4 pb-12 ${appScreen === 'menu' ? 'pt-1' : 'pt-8'}`}>
        {appScreen === 'menu' && (
          <StartScreen onStart={handleStart} />
        )}

        {appScreen === 'quiz' && state.phase === 'playing' && state.questions.length > 0 && (
          // key={currentIndex} causes React to unmount+remount this div on each
          // new question, which restarts the .card-enter CSS animation.
          <div
            key={state.currentIndex}
            className={`w-full transition-all ease-in ${isExiting ? 'duration-150' : ''} card-enter`}
            style={exitStyle}
          >
            <QuizCard
              question={state.questions[state.currentIndex]}
              answerRecord={currentAnswer}
              onAnswer={handleAnswer}
              questionNumber={state.currentIndex + 1}
              totalQuestions={state.totalQuestions}
              mode={state.mode}
              challenge={state.challenge}
            />
          </div>
        )}

        {appScreen === 'quiz' && state.phase === 'finished' && (
          <ResultScreen
            answers={state.answers}
            score={state.score}
            totalQuestions={state.totalQuestions}
            mode={state.mode}
            challenge={state.challenge}
            onRestart={handlePlayAgain}
          />
        )}
      </main>

      {/* Confirm modal — rendered at root level so it overlays everything */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction === 'quit' ? 'Leave quiz?' : 'Restart quiz?'}
          message={
            confirmAction === 'quit'
              ? 'Your progress will be lost. Are you sure you want to return to the menu?'
              : 'Your current progress will be lost. Start over from question 1?'
          }
          confirmLabel={confirmAction === 'quit' ? 'Leave' : 'Restart'}
          cancelLabel="Keep playing"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
