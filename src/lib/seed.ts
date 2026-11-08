import { countCards, createCard } from './db'

const DEMO_CARDS = [
  {
    question: 'What does FSRS stand for?',
    answer: 'Free Spaced Repetition Scheduler',
    options: [
      'Fast Study Recall System',
      'Free Spaced Repetition Scheduler',
      'Fixed Sequence Review Standard',
      'Forgetting Slope Regression Score',
    ],
    correctIndex: 1,
    tags: ['fsrs', 'basics'],
  },
  {
    question: 'Where does this app store your flashcards?',
    answer: 'In IndexedDB in your browser on this device',
    options: [
      'On a remote server database',
      'In a downloaded CSV file only',
      'In IndexedDB in your browser on this device',
      'In GitHub Issues',
    ],
    correctIndex: 2,
    tags: ['app', 'basics'],
  },
  {
    question: 'Which rating should you pick when you get a card wrong?',
    answer: 'Mark it wrong — FSRS schedules it as Again',
    options: [
      'Easy, to skip ahead',
      'Mark it wrong — FSRS schedules it as Again',
      'Delete the card',
      'Good, if the topic feels familiar',
    ],
    correctIndex: 1,
    tags: ['fsrs', 'study'],
  },
  {
    question: 'How do tags affect the study pool?',
    answer: 'You can filter or draw due cards by one or more tags',
    options: [
      'Tags only change card colors',
      'Tags are ignored during study',
      'You can filter or draw due cards by one or more tags',
      'Tags replace the question text',
    ],
    correctIndex: 2,
    tags: ['tags', 'study'],
  },
] as const

/** Seed a few demo cards the first time the library is empty. */
export async function seedDemoCardsIfEmpty(): Promise<boolean> {
  if ((await countCards()) > 0) return false
  for (const card of DEMO_CARDS) {
    await createCard({
      question: card.question,
      answer: card.answer,
      options: [...card.options],
      correctIndex: card.correctIndex,
      tags: [...card.tags],
    })
  }
  return true
}
