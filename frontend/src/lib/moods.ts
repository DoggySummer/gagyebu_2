export const MOODS = [
  { score: 1, emoji: '😔' },
  { score: 2, emoji: '😐' },
  { score: 3, emoji: '🙂' },
  { score: 4, emoji: '😊' },
  { score: 5, emoji: '😄' },
] as const

export function moodEmoji(score: number | null): string | null {
  return MOODS.find((mood) => mood.score === score)?.emoji ?? null
}
