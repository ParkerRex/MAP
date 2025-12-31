import { Calendar, Settings } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  return (
    <nav className="w-64 bg-gray-100 p-4">
      <ul className="space-y-2">
        <li>
          <Link
            href="/calendar"
            className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded"
          >
            <Calendar className="h-5 w-5" />
            <span>Calendar</span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings"
            className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
