"use client";
import { useUpdateTaskTags } from "@/actions/tasks/clientActions";
import type { Tag as TagType } from "@/types";
import { Button } from "@map/ui/button";
import { motion } from "framer-motion";
import React from "react";
import type { FC } from "react";

interface TagFilterProps {
  tags: TagType[];
  selectedTags: string[];
  handleTagSelect: (tag: string) => void;
  taskId: string | undefined;
}

const TagFilter: FC<TagFilterProps> = ({
  tags,
  selectedTags,
  handleTagSelect,
  taskId,
}) => {
  const updateTaskTagsMutation = useUpdateTaskTags();

  const handleTagClick = async (tagTitle: string) => {
    handleTagSelect(tagTitle);
    if (taskId) {
      const updatedTags = selectedTags.includes(tagTitle)
        ? selectedTags.filter((t) => t !== tagTitle)
        : [...selectedTags, tagTitle];

      console.log(`Updating tags for task ${taskId}:`, updatedTags);
      await updateTaskTagsMutation.mutateAsync({ taskId, tags: updatedTags });
      console.log(`Tags updated for task ${taskId}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {tags.map((tag) => (
        <motion.div
          key={tag.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Button
            variant={selectedTags.includes(tag.title) ? "secondary" : "default"}
            onClick={() => handleTagClick(tag.title)}
          >
            {tag.title}
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default TagFilter;
