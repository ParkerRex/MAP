'use client';

import { Reorder } from 'framer-motion';
import {
  Archive,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  Star,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';

const mainItems = [
  { icon: Inbox, label: 'Inbox', count: 1, color: 'text-blue-500' },
  { icon: Star, label: 'Today', count: 2, color: 'text-yellow-500' },
  { icon: Calendar, label: 'Upcoming', color: 'text-red-500' },
  { icon: Layers, label: 'Anytime', color: 'text-green-500' },
  { icon: Archive, label: 'Someday', color: 'text-yellow-500' },
  { icon: CheckSquare, label: 'Logbook', color: 'text-green-500' },
  { icon: Trash2, label: 'Trash', color: 'text-gray-500' },
];

const projectSpaces = [
  { icon: Layers, label: 'Books List' },
  { icon: Layers, label: 'Fitness' },
];

const ProjectsSidebar = ({ isCollapsed, toggleCollapse }) => {
  const [projects, setProjects] = useState([
    'Map Roadmap',
    'VIM Setup',
    'Movie list',
    'Daily',
    'Reading List',
    'Sunday Repeat',
    'Recipes',
    'OSS',
    'Later Projects',
  ]);

  const [spaces, setSpaces] = useState(projectSpaces);

  return (
    <div
      className={`flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-[#F5F6F8] dark:bg-[#2E2E2E] h-screen z-10 transition-width duration-300 border-r border-gray-300 dark:border-gray-700`}
    >
      <div className="flex justify-end p-2">
        <button type="button" onClick={toggleCollapse}>
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
        <div className="flex flex-col gap-1">
          {mainItems.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-[#09090B] rounded cursor-pointer transition-colors duration-300 select-none"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              {!isCollapsed && (
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {item.label}
                </span>
              )}
              {item.count !== undefined && !isCollapsed && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex flex-col gap-1 mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                Projects
              </p>
              <Reorder.Group
                axis="y"
                values={projects}
                onReorder={setProjects}
                className="flex flex-col gap-1"
              >
                {projects.map((project, index) => (
                  <Reorder.Item
                    key={project}
                    value={project}
                    className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-[#09090B] rounded cursor-pointer transition-colors duration-300"
                  >
                    <span className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded-full" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {project}
                    </span>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectsSidebar;
