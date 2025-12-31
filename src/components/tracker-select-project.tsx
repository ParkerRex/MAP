"use client";

// TODO: Implement createProjectAction
// import { createProjectAction } from "@/actions/project/create-project-action";
// TODO: Implement tracker projects query
import { Combobox, type Option } from "@/components/ui/combobox";
import { useToast } from "@/components/ui/use-toast";
// TODO: Implement useAction
// import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function TrackerSelectProject({
  setParams,
  teamId: _teamId,
}: {
  setParams: (params: { projectId: string | null }) => void;
  teamId: string;
}) {
  const { toast: _toast } = useToast();
  const [value, setValue] = useState<Option | undefined>(undefined);
  // Initialize with default data
  const [data, setData] = useState<Option[]>([
    { id: "1", name: "Project A" },
    { id: "2", name: "Project B" },
    { id: "3", name: "Project C" },
  ]);
  const [isLoading, setLoading] = useState(false);

  // TODO: Implement createProjectAction
  // const action = useAction(createProjectAction, {
  //   onSuccess: ({ data: project }) => {
  //     setParams({ projectId: project?.id || null });
  //   },
  //   onError: () => {
  //     toast({
  //       duration: 3500,
  //       variant: "error",
  //       title: "Something went wrong please try again.",
  //     });
  //   },
  // });

  const onChangeValue = async (query: string) => {
    setValue({ id: query, name: query });
    setLoading(true);

    // TODO: Implement tracker projects query
    // Simulating API call with setTimeout
    setTimeout(() => {
      const fakeProjectsData = [
        { id: "1", name: "Project A" },
        { id: "2", name: "Project B" },
        { id: "3", name: "Project C" },
      ].filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase()),
      );

      setLoading(false);
      setData(fakeProjectsData);
    }, 500);
  };

  const onSelect = (project: Option) => {
    setParams({ projectId: project.id });
  };


  return (
    <Combobox
      placeholder="Search or create project"
      classNameList="-top-[4px] border-t-0 rounded-none rounded-b-md"
      className="w-full bg-transparent px-12 border py-3"
      value={value}
      onValueChange={onChangeValue}
      onSelect={onSelect}
      options={data}
      isLoading={isLoading}
      // TODO: Implement createProjectAction
      // onCreate={(name) => action.execute({ name })}
    />
  );
}
