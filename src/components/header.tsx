import type React from "react";

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={`bg-white dark:bg-gray-800 shadow-xs py-4 px-6 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">MAP Dashboard</h1>
    </header>
  );
};
