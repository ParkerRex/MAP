import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "../client/server";
import {
  getGoalsQuery,
  getProjectsQuery,
  getTasksQuery,
  getUserQuery,
} from "../queries";

export const getSession = cache(async () => {
  const supabase = createClient();

  return supabase.auth.getSession();
});

export const getUser = async () => {
  const {
    data: { session },
  } = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const supabase = createClient();

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, userId);
    },
    ["user", userId],
    {
      tags: [`user_${userId}`],
      revalidate: 180,
    },
  )();
};

export const getGoals = async () => {
  const supabase = createClient();
  const user = await getUser();
  const userId = user?.id;

  if (!userId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getGoalsQuery(supabase, userId);
    },
    ["goals", userId],
    {
      tags: [`goals_${userId}`],
      revalidate: 180,
    },
  );
};

export const getTasks = async () => {
  const supabase = createClient();
  const user = await getUser();
  const userId = user?.id;

  if (!userId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTasksQuery(supabase, userId);
    },
    ["tasks", userId],
    {
      tags: [`tasks_${userId}`],
      revalidate: 180,
    },
  );
};

export const getProjects = async () => {
  const supabase = createClient();
  const user = await getUser();
  const userId = user?.id;

  if (!userId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getProjectsQuery(supabase, userId);
    },
    ["projects", userId],
    {
      tags: [`projects_${userId}`],
      revalidate: 180,
    },
  );
};
