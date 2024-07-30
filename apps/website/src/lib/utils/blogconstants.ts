import { BlogSection } from './blog';

export type SectionDetails = {
  title: string;
  description: string;
  image?: string;
};

export const BLOG_SECTIONS_DETAILS: Record<BlogSection, SectionDetails> = {
  [BlogSection.Lists]: {
    title: 'Curated Lists',
    description: 'Explore our curated lists of topics, tips, and tools.',
    image: '/images/lists-section.jpg',
  },
  [BlogSection.Letters]: {
    title: 'Momentum Letters',
    description: 'Read open letters from our community and team.',
    image: '/images/letters-section.jpg',
  },
  [BlogSection.Routines]: {
    title: 'Daily Routines',
    description: 'Discover daily routines and habits for success.',
    image: '/images/routines-section.jpg',
  },
  [BlogSection.Resources]: {
    title: 'Resources',
    description:
      'Access a wealth of resources to fuel your growth and learning.',
    image: '/images/resources-section.jpg',
  },
};
