"use server";

import { authActionClient } from "@/actions/safe-action";
import { createProjectSchema } from "@/actions/schema";
import { LogEvents } from "@map/events/events";
// import { createProject } from "@map/supabase/mutations";
// import { revalidateTag } from "next/cache";

export const createProjectAction = authActionClient
  .schema(createProjectSchema)
  .metadata({
    name: "create-project",
    track: {
      event: LogEvents.ProjectCreated.name,
      channel: LogEvents.ProjectCreated.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    // TODO: Implement actual project creation when DB is ready
    // const { data } = await createProject(supabase, {
    //   ...params,
    //   team_id: user.team_id,
    // });

    // TODO: Implement revalidation when DB is ready
    // revalidateTag(`tracker_projects_${user.team_id}`);

    // Stub: Return fake data for UI testing
    const fakeData = {
      id: "fake-project-id",
      name: params.name,
      description: params.description,
      currency: params.currency,
      status: params.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return fakeData;
  });
