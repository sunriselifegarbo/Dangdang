import type { ItemResult, SessionType, WordStat } from './models'
export const MASTERY_RULES = {
  requiredCorrectStreak: 3,
  reviewTypes: ['wrong-retry', 'missed-retry', 'review'] as readonly SessionType[],
} as const
export function updateWordStat(
  previous: WordStat, result: ItemResult, type: SessionType, reviewedAt: number,
  requiredCorrectStreak: number = MASTERY_RULES.requiredCorrectStreak,
): WordStat {
  if (!Number.isInteger(requiredCorrectStreak) || requiredCorrectStreak < 1) throw new RangeError('requiredCorrectStreak')
  if (result === 'unwritten') return { ...previous, status: 'missed', streak: 0 }
  const next = { ...previous, lastReviewedAt: reviewedAt }
  if (result === 'wrong') return { ...next, status: 'unmastered', streak: 0, wrongCount: previous.wrongCount + 1 }
  if (previous.status === 'mastered' || !MASTERY_RULES.reviewTypes.includes(type)) return next
  const streak = previous.streak + 1
  return { ...next, streak, status: streak >= requiredCorrectStreak ? 'mastered' : previous.status }
}
