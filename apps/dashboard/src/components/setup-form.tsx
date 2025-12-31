"use client";

import { setupUserSchema } from "@/actions/schema";
import { setupUserAction } from "@/actions/setup-user-action";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export function SetupForm() {
  const { toast } = useToast();

  const setupUser = useAction(setupUserAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const form = useForm<z.infer<typeof setupUserSchema>>({
    resolver: zodResolver(setupUserSchema),
    defaultValues: {
      full_name: "",
    },
  });

  const isSubmitting =
    setupUser.status !== "idle" && setupUser.status !== "hasErrored";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(setupUser.execute)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormDescription>
                This is your first and last name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Submit</span>
          )}
        </Button>
      </form>
    </Form>
  );
}
