import { createClient } from "@/lib/db/client";
// TODO: Implement getCurrentUserTeamQuery and getTeamMembersQuery
// import {
//   getCurrentUserTeamQuery,
//   getTeamMembersQuery,
// } from "@map/supabase/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@map/ui/select";
import { Skeleton } from "@map/ui/skeleton";
import { useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

type User = {
  id: string;
  avatar_url?: string | null;
  full_name: string | null;
};

type Props = {
  selectedId: string;
  isLoading: boolean;
  onSelect: (user?: User) => void;
};

export function AssignUser({ selectedId, isLoading, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  useEffect(() => {
    async function getUsers() {
      // TODO: Implement actual API calls
      // const { data: userData } = await getCurrentUserTeamQuery(supabase);

      // Stub: Simulating API call with setTimeout
      setTimeout(() => {
        const stubUsers: User[] = [
          {
            id: "1",
            full_name: "John Doe",
            avatar_url: "https://example.com/avatar1.jpg",
          },
          {
            id: "2",
            full_name: "Jane Smith",
            avatar_url: "https://example.com/avatar2.jpg",
          },
          {
            id: "3",
            full_name: "Bob Johnson",
            avatar_url: "https://example.com/avatar3.jpg",
          },
        ];
        setUsers(stubUsers);
      }, 1000);
    }

    getUsers();
  }, [supabase]);

  return (
    <div className="relative">
      {isLoading ? (
        <div className="h-[36px] border">
          <Skeleton className="h-[14px] w-[60%] absolute left-3 top-[39px]" />
        </div>
      ) : (
        <Select
          value={value}
          onValueChange={(id) => onSelect(users.find((user) => user.id === id))}
        >
          <SelectTrigger
            id="assign"
            className="line-clamp-1 truncate"
            onKeyDown={(evt) => evt.preventDefault()}
          >
            <SelectValue placeholder="Select" />
          </SelectTrigger>

          <SelectContent className="overflow-y-auto max-h-[200px]">
            {users?.map((user) => {
              return (
                <SelectItem key={user?.id} value={user?.id}>
                  <AssignedUser
                    fullName={user?.full_name}
                    avatarUrl={user?.avatar_url}
                  />
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
