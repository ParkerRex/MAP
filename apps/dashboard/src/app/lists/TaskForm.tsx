"use client";

import { Button } from "@map/ui/button";
import DatePicker from "@map/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@map/ui/dropdown-menu";
import { FormControl, FormItem, FormLabel } from "@map/ui/form";
import { Input } from "@map/ui/input";
import { Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createTag, getAllTags } from "./listActions";

interface TaskFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
}

interface TaskFormData {
  title: string;
  contactName?: string;
  contactEmail?: string;
  contactPhoneNumber?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit }) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const methods = useForm();

  const handleDateChange = (date: Date | null | undefined) => {
    setSelectedDate(date ?? undefined);
  };

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getAllTags();
      setAvailableTags(tags.map((tag) => tag.title));
    };
    fetchTags();
  }, []);

  const onSubmitHandler = async (data: TaskFormData) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        formData.append(key, value);
      }
    }
    if (selectedDate) {
      formData.set("due_at", selectedDate.toISOString());
    }
    formData.set("sourceType", "user");
    formData.set("tags", tags.join(","));
    await onSubmit(formData);
  };

  const addTag = async () => {
    if (newTag && !tags.includes(newTag)) {
      if (!availableTags.includes(newTag)) {
        await createTag(newTag);
        setAvailableTags([...availableTags, newTag]);
      }
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagSelect = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmitHandler)}>
        <FormItem>
          <FormLabel>Task Name</FormLabel>
          <FormControl>
            <Input
              type="text"
              {...methods.register("title", {
                required: true,
              })}
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Tags</FormLabel>
          <FormControl>
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded"
                  >
                    <span>{tag}</span>
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <Tag className="w-5 h-5" />
                      <span>Select Tags</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Available Tags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableTags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={tags.includes(tag)}
                        onCheckedChange={() => handleTagSelect(tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <div className="px-4 py-2">
                      <Input
                        placeholder="New tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addTag();
                          }
                        }}
                      />
                      <Button onClick={addTag} className="mt-2">
                        Add Tag
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Due Date:</FormLabel>
          <FormControl>
            <DatePicker
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </FormControl>
        </FormItem>

        {showMore && (
          <>
            <FormItem>
              <FormLabel>Contact Name:</FormLabel>
              <FormControl>
                <Input type="text" {...methods.register("contactName")} />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Contact Email:</FormLabel>
              <FormControl>
                <Input type="email" {...methods.register("contactEmail")} />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Contact Phone Number:</FormLabel>
              <FormControl>
                <Input type="tel" {...methods.register("contactPhoneNumber")} />
              </FormControl>
            </FormItem>
          </>
        )}

        <div className="mt-4 flex justify-between">
          <Button type="submit">Create</Button>
          <Button
            type="button"
            variant="link"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? "Less" : "More"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TaskForm;
