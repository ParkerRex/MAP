'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  const { theme } = useTheme();

  return (
    <Link href="/" className={`flex items-center gap-x-2 ${className}`}>
      {theme === 'dark' ? (
        <Image
          src="/logo-dark.svg"
          alt="logo"
          height={18}
          width={63}
          className="object-contain w-full h-auto"
        />
      ) : (
        <Image
          src="/logo-light.svg"
          alt="logo"
          height={18}
          width={63}
          className="object-contain w-full h-auto"
        />
      )}
    </Link>
  );
};

export default Logo;
