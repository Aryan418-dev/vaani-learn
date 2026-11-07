export const lessons = [
  {
    id: 'les01',
    name: 'Greetings & introductions',
    description: 'Practice saying hello, introducing yourself, and asking someone\'s name.',
    level: 'Beginner',
    language: 'English',
    topic: 'Daily conversation',
    durationMin: 10,
  },
  {
    id: 'les02',
    name: 'Ordering food',
    description: 'Speak like you are at a café — menus, quantities, polite requests.',
    level: 'Beginner',
    language: 'English',
    topic: 'Food',
    durationMin: 12,
  },
  {
    id: 'les03',
    name: 'Asking for directions',
    description: 'Ask where places are and understand simple directions.',
    level: 'Beginner',
    language: 'English',
    topic: 'Travel',
    durationMin: 10,
  },
  {
    id: 'les04',
    name: 'School day',
    description: 'Talk about classes, homework, and after-school plans.',
    level: 'Intermediate',
    language: 'English',
    topic: 'School',
    durationMin: 15,
  },
  {
    id: 'les05',
    name: 'Job interview basics',
    description: 'Answer common interview questions clearly and confidently.',
    level: 'Intermediate',
    language: 'English',
    topic: 'Career',
    durationMin: 15,
  },
  {
    id: 'les06',
    name: 'Hindi greetings',
    description: 'Hindi greetings and self-introduction for beginners.',
    level: 'Beginner',
    language: 'Hindi',
    topic: 'Daily conversation',
    durationMin: 10,
  },
];

export const drills = [
  {
    id: 'dr01',
    lessonId: 'les01',
    name: 'Say hello',
    prompt: 'Introduce yourself in two sentences. Include your name and where you are from.',
    modelAnswer: 'Hello, my name is Priya. I am from Pune.',
    hint: 'Start with Hello or Hi',
  },
  {
    id: 'dr02',
    lessonId: 'les01',
    name: 'Ask a name',
    prompt: 'Politely ask someone what their name is.',
    modelAnswer: 'Excuse me, what is your name?',
    hint: 'Use please or excuse me',
  },
  {
    id: 'dr03',
    lessonId: 'les02',
    name: 'Order coffee',
    prompt: 'Order a coffee and a sandwich at a café.',
    modelAnswer: 'Hi, I would like a coffee and a sandwich, please.',
    hint: 'I would like…',
  },
  {
    id: 'dr04',
    lessonId: 'les02',
    name: 'Ask for the bill',
    prompt: 'Ask the waiter for the bill politely.',
    modelAnswer: 'Could I have the bill, please?',
    hint: 'Could I have…',
  },
  {
    id: 'dr05',
    lessonId: 'les03',
    name: 'Where is the station?',
    prompt: 'Ask a stranger where the train station is.',
    modelAnswer: 'Excuse me, where is the train station?',
    hint: 'Excuse me…',
  },
  {
    id: 'dr06',
    lessonId: 'les04',
    name: 'Favourite subject',
    prompt: 'Say what your favourite subject is and why.',
    modelAnswer: 'My favourite subject is science because I like experiments.',
    hint: 'My favourite subject is…',
  },
  {
    id: 'dr07',
    lessonId: 'les05',
    name: 'Strengths',
    prompt: 'Tell the interviewer about one of your strengths.',
    modelAnswer: 'One of my strengths is that I work well in a team.',
    hint: 'One of my strengths is…',
  },
  {
    id: 'dr08',
    lessonId: 'les06',
    name: 'Hindi greeting',
    prompt: 'Say namaste and introduce your name in Hindi.',
    modelAnswer: 'Namaste, mera naam Aarav hai.',
    hint: 'Namaste, mera naam…',
  },
];

export function getLesson(id) {
  return lessons.find((l) => l.id === id);
}

export function getDrillsForLesson(lessonId) {
  return drills.filter((d) => d.lessonId === lessonId);
}

export function getDrill(id) {
  return drills.find((d) => d.id === id);
}
