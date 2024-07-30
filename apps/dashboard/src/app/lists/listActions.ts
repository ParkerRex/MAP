"use server";
import type { Tag, Task } from "@/types";
import { createClient } from "@map/supabase/server";
import { revalidatePath } from "next/cache";

// Tag Actions
export async function getAllTags(): Promise<Tag[]> {
  const supabase = createClient();
  console.log("Entering getAllTags function");
  try {
    const { data, error } = await supabase.from("tag").select("*");
    if (error) {
      console.error("Error in getAllTags:", error);
      throw new Error(error.message);
    }
    console.log("Successfully retrieved tags:", data);
    return data as Tag[];
  } catch (error) {
    console.error("Caught error in getAllTags:", error);
    throw error;
  }
}

export async function createTag(title: string): Promise<Tag> {
  const supabase = createClient();
  console.log("Entering createTag function with title:", title);
  try {
    const { data, error } = await supabase
      .from("tag")
      .insert({ title })
      .select()
      .single();
    if (error) {
      console.error("Error in createTag:", error);
      throw new Error(error.message);
    }
    console.log("Successfully created tag:", data);
    return data as Tag;
  } catch (error) {
    console.error("Caught error in createTag:", error);
    throw error;
  }
}

export async function updateTag(id: string, title: string): Promise<Tag> {
  const supabase = createClient();
  console.log(`Entering updateTag function with id: ${id}, title: ${title}`);
  try {
    const { data, error } = await supabase
      .from("tag")
      .update({ title })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Error in updateTag:", error);
      throw new Error(error.message);
    }
    console.log("Successfully updated tag:", data);
    return data as Tag;
  } catch (error) {
    console.error("Caught error in updateTag:", error);
    throw error;
  }
}

export async function deleteTag(tagId: string) {
  const supabase = createClient();
  console.log("Entering deleteTag function with tagId:", tagId);
  try {
    const { error: tagTaskError } = await supabase
      .from("tag_task")
      .delete()
      .eq("tag_id", tagId);
    if (tagTaskError) {
      console.error("Error deleting from tags_tasks:", tagTaskError);
      throw new Error(tagTaskError.message);
    }
    const { error } = await supabase.from("tag").delete().eq("id", tagId);
    if (error) {
      console.error("Error deleting tag:", error);
      throw new Error(error.message);
    }
    console.log("Successfully deleted tag and related entries");
    revalidatePath("/lists");
  } catch (error) {
    console.error("Caught error in deleteTag:", error);
    throw error;
  }
}

// Task Actions
export async function getAllTasks(): Promise<Task[]> {
  const supabase = createClient();
  console.log("Entering getAllTasks function");
  try {
    const { data, error } = await supabase
      .from("task")
      .select("*, tags (id, title)");
    if (error) {
      console.error("Error in getAllTasks:", error);
      throw new Error(error.message);
    }
    console.log("Successfully retrieved tasks:", data);
    return data as Task[];
  } catch (error) {
    console.error("Caught error in getAllTasks:", error);
    throw error;
  }
}

export async function handleCreateTask(formData: FormData) {
  const supabase = createClient();
  console.log("Entering handleCreateTask function");
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      console.error("User not authenticated in handleCreateTask");
      throw new Error("User not authenticated");
    }
    const title = formData.get("title") as string;
    if (title.trim() === "") {
      console.log("Empty title in handleCreateTask, returning early");
      return;
    }
    const { data: taskData, error: taskError } = await supabase
      .from("task")
      .insert({
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();
    if (taskError) {
      console.error("Error in handleCreateTask:", taskError);
      throw new Error(taskError.message);
    }
    console.log("Successfully created task:", taskData);
    revalidatePath("/lists");
  } catch (error) {
    console.error("Caught error in handleCreateTask:", error);
    throw error;
  }
}

export async function handleDeleteTask(taskId: string) {
  const supabase = createClient();
  console.log("Entering handleDeleteTask function with taskId:", taskId);
  try {
    const { error: tagTaskError } = await supabase
      .from("tag_task")
      .delete()
      .eq("task_id", taskId);
    if (tagTaskError) {
      console.error("Error deleting from tags_tasks:", tagTaskError);
      throw new Error(tagTaskError.message);
    }
    const { error } = await supabase.from("task").delete().eq("id", taskId);
    if (error) {
      console.error("Error deleting task:", error);
      throw new Error(error.message);
    }
    console.log("Successfully deleted task and related entries");
    revalidatePath("/lists");
  } catch (error) {
    console.error("Caught error in handleDeleteTask:", error);
    throw error;
  }
}

export async function updateTaskDueDate(taskId: string, dueDate: string) {
  const supabase = createClient();
  console.log(
    `Entering updateTaskDueDate function with taskId: ${taskId}, dueDate: ${dueDate}`,
  );
  try {
    const { data, error } = await supabase
      .from("task")
      .update({ due_at: dueDate })
      .eq("id", taskId);
    if (error) {
      console.error("Error in updateTaskDueDate:", error);
      throw new Error(error.message);
    }
    console.log("Successfully updated task due date:", data);
    revalidatePath("/lists");
    return data;
  } catch (error) {
    console.error("Caught error in updateTaskDueDate:", error);
    throw error;
  }
}

export async function handleToggleTask(
  taskId: string,
  completed_at: string | null,
) {
  const supabase = createClient();
  console.log(
    `Entering handleToggleTask function with taskId: ${taskId}, completed_at: ${completed_at}`,
  );
  try {
    const { data, error } = await supabase
      .from("task")
      .update({
        completed_at: completed_at ? new Date().toISOString() : null,
      })
      .eq("id", taskId);
    if (error) {
      console.error("Error in handleToggleTask:", error);
      throw new Error(error.message);
    }
    console.log("Successfully toggled task completion:", data);
    return data;
  } catch (error) {
    console.error("Caught error in handleToggleTask:", error);
    throw error;
  }
}

export async function updateTaskTags(
  taskId: string,
  tags: string[],
): Promise<void> {
  const supabase = createClient();
  console.log(`Updating tags for task ${taskId}:`, tags);
  try {
    // Start a transaction
    const { error } = await supabase.rpc("update_task_tags", {
      p_task_id: taskId,
      p_tag_titles: tags,
    });

    if (error) throw error;
    console.log("Task tags updated successfully");
    revalidatePath("/lists");
  } catch (error) {
    console.error("Error updating task tags:", error);
    throw error;
  }
}
