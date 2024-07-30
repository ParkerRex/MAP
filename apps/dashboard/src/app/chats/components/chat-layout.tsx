'use client';

import React, { useState } from 'react';
import { Chat } from './chat';
import { userData } from './data';
import { Sidebar } from './sidebar';

export function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState(userData[0]);

  return (
    <div className="flex h-full w-full bg-background dark:bg-dark-background">
      <div className="w-[400px] transition-all duration-300 ease-in-out">
        <Sidebar
          links={userData.map((user) => ({
            name: user.name,
            messages: user.messages ?? [],
            avatar: user.avatar,
            variant: selectedUser.name === user.name ? 'grey' : 'ghost',
          }))}
        />
      </div>
      <div className="flex-grow w-[900px]">
        <Chat messages={selectedUser.messages} selectedUser={selectedUser} />
      </div>
    </div>
  );
}
