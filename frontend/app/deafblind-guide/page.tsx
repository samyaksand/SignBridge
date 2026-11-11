import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'For deafblind caregivers | SignBridge',
  description:
    'An honest starting orientation to tactile and hand-under-hand signing for a hearing, sighted caregiver of a deafblind child.',
};

export default function DeafblindGuidePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
        For deafblind caregivers
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
        If the child you care for is deafblind, the visual sign videos elsewhere on SignBridge
        were not built with them in mind. This page is a short, honest starting orientation to
        tactile signing and hand-under-hand signing for a hearing, sighted caregiver who is new
        to this. It is not a tactile ASL or ISL curriculum, SignBridge does not have one and
        does not claim to.
      </p>

      <Card className="mt-6 flex flex-col gap-3 p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          What tactile signing is, and why it is different
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Visual sign language is received through the eyes: a learner watches a signer&apos;s
          hands, face, and body from a short distance. A deafblind child cannot receive language
          that way, so the same information has to travel through touch instead. That changes
          more than the input channel, it changes the whole interaction. The child is not
          watching you sign. They are feeling your hands, your movement, and your rhythm, often
          with their own hands resting on or around yours.
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Because of this, tactile communication tends to be slower, closer, and far more
          dependent on trust and predictability than visual signing. A child who cannot see your
          face cannot tell from a glance whether you are about to sign, whether you are leaving
          the room, or whether someone new has entered. Touch has to carry all of that
          information too, not just the words.
        </p>
      </Card>

      <Card className="mt-6 flex flex-col gap-3 p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          What hand-under-hand signing is
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Hand-under-hand signing is an approach where the caregiver&apos;s hands rest gently
          underneath the child&apos;s hands, rather than physically moving the child&apos;s hands
          through a sign (that second approach is usually called hand-over-hand, and it is
          generally considered more controlling and less respectful of the child&apos;s own
          movement). With hand-under-hand, the child&apos;s hands stay on top, free to follow,
          pull back, or explore at their own pace, while your hands underneath provide the shape
          and movement of the sign for them to feel.
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          The idea is to let the child remain an active participant rather than a passive
          recipient. They can choose to keep their hands resting on yours, pull away if they are
          not interested or need a break, or press in more firmly if they want to feel the
          movement more clearly. That choice matters as much as the sign itself.
        </p>
      </Card>

      <Card className="mt-6 flex flex-col gap-3 p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Basic etiquette</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <li>
            Always identify yourself by touch before you begin signing, every single time, even
            if you were together a moment ago. A consistent personal touch signal (a light tap
            on the shoulder, a particular way of touching their hand) lets the child know who is
            there before anything else happens. Never begin signing into a child&apos;s hands
            without this.
          </li>
          <li>
            Move at the child&apos;s pace, not yours. If they pull their hands back, slow down,
            pause, or stop and wait rather than continuing or repeating more insistently. Pulling
            away is communication, not a lapse in attention.
          </li>
          <li>
            Never force or physically guide hand placement. If hand-under-hand is new to a
            child, let them rest their hands on yours in their own time. Offer your hands, do
            not take theirs.
          </li>
          <li>
            Tell the child when you are leaving or when your hands are about to leave theirs.
            Disappearing mid-interaction, even briefly, can be disorienting in a way it would not
            be for a sighted child who can simply look up and see you are still there.
          </li>
          <li>
            Keep your own movements calm and consistent. Sudden, fast, or erratic hand movement
            is harder to interpret through touch than through sight, and can be startling.
          </li>
          <li>
            Respect no as an answer. A child pulling away from a sign, a touch, or an
            interaction is allowed to mean they do not want it right now, the same as it would
            for any other way of communicating no.
          </li>
        </ul>
      </Card>

      <Card className="mt-6 flex flex-col gap-3 p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          What this page is, and is not
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          This is a starting orientation written with care, not a complete tactile ASL or ISL
          curriculum, not a substitute for guidance from a qualified deafblind education
          specialist or intervenor, and not a medical or clinical resource. It has not been
          reviewed by any certifying body or organization, and SignBridge does not claim any
          such review. If you are a caregiver taking your first steps into tactile
          communication, treat this as a gentle introduction to the ideas, and look for a
          qualified professional in deafblind education where one is available to you for
          anything beyond this starting point.
        </p>
      </Card>

      <p className="mt-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="font-medium text-[var(--color-green-600)] underline">
          Back to SignBridge home
        </Link>
      </p>
    </div>
  );
}
