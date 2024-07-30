export const userData = [
  {
    id: 1,
    avatar: '/chat/mattfitness.png',
    messages: [
      {
        id: 1,
        avatar: '/chat/mattfitness.png',
        name: 'Matt Fitness',
        message: 'Good morning, Parker.',
      },
      {
        id: 2,
        avatar: '/chat/avatar.png',
        name: 'Parker Rex',
        message: 'Good morning, Coach.',
      },
      {
        id: 3,
        avatar: '/chat/mattfitness.png',
        name: 'Matt Fitness',
        message:
          'Great job on your walk yesterday. You walked 5 miles and burned 400 calories.',
      },
      {
        id: 4,
        avatar: '/chat/avatar.png',
        name: 'Parker Rex',
        message: 'Thanks. How am I doing towards my goals?',
      },
      {
        id: 5,
        avatar: '/chat/mattfitness.png',
        name: 'Matt Fitness',
        message: "You're on track. You've completed 70% of your weekly goal.",
      },
      {
        id: 6,
        avatar: '/chat/avatar.png',
        name: 'Parker Rex',
        message: "That's good to hear.",
      },
      {
        id: 7,
        avatar: '/chat/mattfitness.png',
        name: 'Matt Fitness',
        message:
          'Today is a push day. Start with incline bench press, 4 sets of 8 reps. Then do chest flies, 3 sets of 12 reps. Follow up with tricep dips, 3 sets of 10 reps, and finish with overhead tricep extensions, 3 sets of 12 reps.',
      },
      {
        id: 8,
        avatar: '/chat/avatar.png',
        name: 'Parker Rex',
        message: 'Got it. Thanks for the detailed plan.',
      },
      {
        id: 9,
        avatar: '/chat/mattfitness.png',
        name: 'Matt Fitness',
        message:
          "You're welcome. I've added the workout to your calendar with all the details. Don't forget to drink a protein shake after your workout.",
      },
    ],
    name: 'Matt Fitness',
  },
  {
    id: 2,
    avatar: '/chat/ninanutrition.png',
    name: 'Nina Nutrition',
  },
  {
    id: 3,
    avatar: '/chat/benbusiness.png',
    name: 'Ben Business',
  },
  {
    id: 4,
    avatar: '/chat/beckyplans.png',
    name: 'Becky Plans',
  },
];

export type UserData = (typeof userData)[number];

export const loggedInUserData = {
  id: 5,
  avatar: '/chat/avatar.png',
  name: 'Parker Rex',
};

export type LoggedInUserData = typeof loggedInUserData;

export interface Message {
  id: number;
  avatar: string;
  name: string;
  message: string;
}

export interface User {
  id: number;
  avatar: string;
  messages: Message[];
  name: string;
}
