import { useEffect, useState } from 'react';

export function useScrollSpy(ids: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          if (top <= offset && bottom > offset) {
            setActiveSection(id);
            return;
          }
        }
      }
    };

    handleScroll(); // Call once to set initial active section
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [ids, offset]);

  return activeSection;
}
