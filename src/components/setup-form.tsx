"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const setupUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
});

type SetupUserValues = z.infer<typeof setupUserSchema>;

export function SetupForm() {
  const { toast } = useToast();
  const router = useRouter();

  const setupUser = useMutation({
    mutationFn: async (data: SetupUserValues) => {
      const response = await fetch("/api/user/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to setup user");
      return response.json();
    },
    onSuccess: () => {
      router.push("/");
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "destructive",
        title: "Something went wrong please try again.",
      });
    },
  });

  const form = useForm<SetupUserValues>({
    resolver: zodResolver(setupUserSchema),
    defaultValues: {
      full_name: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => setupUser.mutate(data))} className="space-y-8">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormDescription>This is your first and last name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={setupUser.isPending}>
          {setupUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Submit</span>}
        </Button>
      </form>
    </Form>
  );
}
