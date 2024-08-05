import { useEffect, useState } from 'react';

export function useTableOfContents(itemIds: string[]) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [topOffset, setTopOffset] = useState(120);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '0% 0% -80% 0%' },
    );

    for (const id of itemIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    const handleScroll = () => {
      const heroSection = document.querySelector('section.bg-black');
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        const newTopOffset = Math.max(120, heroBottom);
        setTopOffset(newTopOffset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      for (const id of itemIds) {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [itemIds]);

  return { activeSection, topOffset };
}
