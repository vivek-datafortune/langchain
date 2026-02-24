import { Flame, Meh, MessagesSquare, SearchCheck } from 'lucide-react'
import type { Mood } from './types'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

export const MOOD_ICON: Record<Mood, ComponentType<LucideProps>> = {
  Angry:    Flame,
  Neutral:  Meh,
  Feedback: MessagesSquare,
  Enquiry:  SearchCheck,
}
