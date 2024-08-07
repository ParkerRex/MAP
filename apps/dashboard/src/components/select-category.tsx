import { createCategoriesAction } from "@/actions/create-categories-action";
import { getColorFromName } from "@/utils/categories";
// import { createClient } from "@map/supabase/client";
// TODO: Implement these queries
// import {
//   getCategoriesQuery,
//   getCurrentUserTeamQuery,
// } from "@map/supabase/queries";
import { ComboboxDropdown } from "@map/ui/combobox-dropdown";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { CategoryColor } from "./category";

type Selected = {
  id: string;
  name: string;
  color: string;
  slug: string;
};

type Props = {
  selected?: Selected;
  onChange: (selected: Selected) => void;
};

function transformCategory(category: Selected) {
  return {
    id: category.id,
    label: category.name,
    color: category.color,
    slug: category.slug,
  };
}

// Fake data for UI testing
const fakeCategories: Selected[] = [
  { id: "1", name: "Food", color: "#FF5733", slug: "food" },
  { id: "2", name: "Transport", color: "#33FF57", slug: "transport" },
  { id: "3", name: "Entertainment", color: "#3357FF", slug: "entertainment" },
];

export function SelectCategory({ selected, onChange }: Props) {
  const [data, setData] = useState<Selected[]>([]);
  // const supabase = createClient();

  useEffect(() => {
    // TODO: Replace this with actual data fetching when queries are implemented
    setData(fakeCategories);
  }, []);

  const createCategories = useAction(createCategoriesAction, {
    onSuccess: ({ data }) => {
      const category = data?.at(0);

      if (category) {
        setData((prev) => [category, ...prev]);
        onChange(category);
      }
    },
  });

  const selectedValue = selected ? transformCategory(selected) : undefined;

  return (
    <ComboboxDropdown
      disabled={createCategories.status === "executing"}
      placeholder="Select category"
      searchPlaceholder="Search category"
      items={data.map(transformCategory)}
      selectedItem={selectedValue}
      onSelect={(item) => {
        onChange({
          id: item.id,
          name: item.label,
          color: item.color,
          slug: item.slug,
        });
      }}
      onCreate={(value) => {
        createCategories.execute({
          categories: [
            {
              name: value,
              color: getColorFromName(value),
            },
          ],
        });
      }}
      renderSelectedItem={(selectedItem) => (
        <div className="flex items-center space-x-2">
          <CategoryColor color={selectedItem.color} />
          <span className="text-left truncate max-w-[90%]">
            {selectedItem.label}
          </span>
        </div>
      )}
      renderOnCreate={(value) => {
        return (
          <div className="flex items-center space-x-2">
            <CategoryColor color={getColorFromName(value)} />
            <span>{`Create "${value}"`}</span>
          </div>
        );
      }}
      renderListItem={({ item }) => {
        return (
          <div className="flex items-center space-x-2">
            <CategoryColor color={item.color} />
            <span className="line-clamp-1">{item.label}</span>
          </div>
        );
      }}
    />
  );
}
