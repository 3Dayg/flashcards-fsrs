import type { FlashcardInput } from './cardFactory'

export const DEMO_CARDS: FlashcardInput[] = [
  {
    type: 'multiple',
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
    type: 'multiple',
    question: 'Where does this app store your flashcards?',
    answer:
      'In a durable account database when signed in, or IndexedDB on this device for static hosting',
    options: [
      'Only in a downloaded CSV file',
      'In GitHub Issues',
      'In a durable account database when signed in, or IndexedDB on this device for static hosting',
      'Nowhere — cards reset every refresh',
    ],
    correctIndex: 2,
    tags: ['app', 'basics'],
  },
  {
    type: 'multiple',
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
    type: 'multiple',
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
  {
    type: 'trueFalse',
    question: 'FSRS always schedules a wrong answer as Again.',
    answer: 'True — misses map to the Again grade regardless of difficulty.',
    correctBoolean: true,
    tags: ['fsrs', 'study'],
  },
  {
    type: 'open',
    question: 'Name the three difficulty ratings you choose after answering.',
    answer: 'Hard, good, and easy',
    tags: ['fsrs', 'study'],
  },
]
