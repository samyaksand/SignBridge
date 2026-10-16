'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import scenariosData from '@/lib/data/familyScenarios.json';
import cardsData from '@/lib/data/communicationCards.json';

interface Step {
  id: string;
  type: 'situation' | 'parent-reference' | 'child-practice' | 'confirm' | 'complete';
  prompt: string;
  cardId?: string;
  options?: string[];
  correctCardId?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  situation: string;
  steps: Step[];
}

interface CardEntry {
  id: string;
  en: string;
  hi: string;
  illustration: string;
}

const SCENARIOS = scenariosData as Scenario[];
const CARDS = cardsData as CardEntry[];

function cardById(id: string): CardEntry | undefined {
  return CARDS.find((c) => c.id === id);
}

export function FamilyPracticeClient() {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [chosenCardId, setChosenCardId] = useState<string | null>(null);
  const [tryAgainNote, setTryAgainNote] = useState(false);

  const startScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setStepIndex(0);
    setChosenCardId(null);
    setTryAgainNote(false);
  };

  const reset = () => {
    setActiveScenario(null);
    setStepIndex(0);
    setChosenCardId(null);
    setTryAgainNote(false);
  };

  if (!activeScenario) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
          Family Practice
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Pick a scenario and practice it together. No camera or account needed.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SCENARIOS.map((scenario) => (
            <Card key={scenario.id} className="flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{scenario.title}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">{scenario.description}</p>
              <Button onClick={() => startScenario(scenario)} className="mt-auto w-fit">
                Start this scenario
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const step = activeScenario.steps[stepIndex];
  const goNext = () => setStepIndex((i) => Math.min(i + 1, activeScenario.steps.length - 1));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{activeScenario.title}</h1>
        <button
          onClick={reset}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-text-muted)]"
        >
          <RotateCcw size={16} /> Start over
        </button>
      </div>

      <ol className="mb-6 flex gap-2" aria-label="Practice steps">
        {activeScenario.steps.map((s, i) => (
          <li
            key={s.id}
            className={`h-2 flex-1 rounded-full ${
              i <= stepIndex ? 'bg-[var(--color-teal-600)]' : 'bg-[var(--color-border)]'
            }`}
            aria-current={i === stepIndex ? 'step' : undefined}
          />
        ))}
      </ol>

      <Card className="p-6">
        {step.type === 'situation' && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">What is happening</h2>
            <p className="text-[var(--color-text-muted)]">{activeScenario.situation}</p>
            <Button className="mt-5" onClick={goNext}>
              We read it, let&apos;s go
            </Button>
          </div>
        )}

        {step.type === 'parent-reference' && step.cardId && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">For the parent</h2>
            <p className="mb-4 text-[var(--color-text-muted)]">{step.prompt}</p>
            <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <Image
                src={cardById(step.cardId)?.illustration ?? ''}
                alt={cardById(step.cardId)?.en ?? 'Reference card'}
                width={64}
                height={64}
              />
              <div>
                <p className="font-medium text-[var(--color-text)]">{cardById(step.cardId)?.en}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{cardById(step.cardId)?.hi}</p>
              </div>
            </div>
            <Button className="mt-5" onClick={goNext}>
              Ready for the child&apos;s turn
            </Button>
          </div>
        )}

        {step.type === 'child-practice' && step.options && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">For the child</h2>
            <p className="mb-4 text-[var(--color-text-muted)]">{step.prompt}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {step.options.map((optId) => {
                const card = cardById(optId);
                if (!card) return null;
                const selected = chosenCardId === optId;
                return (
                  <button
                    key={optId}
                    onClick={() => {
                      setChosenCardId(optId);
                      setTryAgainNote(false);
                    }}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-2 rounded-[var(--radius-md)] border p-3 text-center transition-colors ${
                      selected
                        ? 'border-[var(--color-teal-600)] bg-[var(--color-surface-muted)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <Image src={card.illustration} alt="" width={48} height={48} aria-hidden="true" />
                    <span className="text-xs font-medium text-[var(--color-text)]">{card.en}</span>
                  </button>
                );
              })}
            </div>
            {tryAgainNote && (
              <StatusMessage kind="warning">
                Not quite, take another look at the reference sign and try again.
              </StatusMessage>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  if (chosenCardId === step.correctCardId) {
                    goNext();
                  } else {
                    setTryAgainNote(true);
                  }
                }}
                disabled={!chosenCardId}
              >
                Confirm choice
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setChosenCardId(null);
                  setTryAgainNote(false);
                }}
              >
                Choose another
              </Button>
            </div>
          </div>
        )}

        {step.type === 'confirm' && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Confirm together</h2>
            <p className="mb-4 text-[var(--color-text-muted)]">{step.prompt}</p>
            {chosenCardId && (
              <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <Image
                  src={cardById(chosenCardId)?.illustration ?? ''}
                  alt=""
                  width={48}
                  height={48}
                  aria-hidden="true"
                />
                <p className="font-medium text-[var(--color-text)]">{cardById(chosenCardId)?.en}</p>
              </div>
            )}
            <Button className="mt-5" onClick={goNext}>
              Yes, that is right
            </Button>
          </div>
        )}

        {step.type === 'complete' && (
          <div className="text-center">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-[var(--color-success)]" />
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">All done!</h2>
            <p className="mb-5 text-[var(--color-text-muted)]">{step.prompt}</p>
            <Button onClick={reset}>Back to scenarios</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
