// TODO: Implement schema and actions
// import { type UpdateTeamFormValues, updateTeamSchema } from "@/actions/schema";
// import { updateTeamAction } from "@/actions/update-team-action";
import { zodResolver } from "@hookform/resolvers/zod";
// TODO: Implement getInboxEmail function
// import { getInboxEmail } from "@map/inbox";
import { Button } from "@map/ui/button";
import { Collapsible, CollapsibleContent } from "@map/ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@map/ui/form";
import { Input } from "@map/ui/input";
import { Label } from "@map/ui/label";
import { Switch } from "@map/ui/switch";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod"; // Import zod for schema definition
import { CopyInput } from "./copy-input";

// TODO: Implement actual schema
const updateTeamSchema = z.object({
  inbox_email: z.string().email().nullable(),
  inbox_forwarding: z.boolean(),
});

type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;

type Props = {
  forwardEmail: string;
  inboxId: string;
  inboxForwarding: boolean;
  onSuccess: () => void;
};

export function InboxSettings({
  forwardEmail,
  inboxForwarding,
  inboxId,
  onSuccess,
}: Props) {
  // TODO: Implement actual action
  const action = {
    execute: (data: UpdateTeamFormValues) => {
      console.log("Executing action with data:", data);
      setTimeout(onSuccess, 1000); // Simulate API call
    },
    status: "idle" as "idle" | "executing",
  };

  const form = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      inbox_email: forwardEmail,
      inbox_forwarding: inboxForwarding,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    action.execute(data);
  });

  // TODO: Implement actual getInboxEmail function
  const getInboxEmail = (id: string) => `inbox-${id}@example.com`;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-3">
        <Label>Inbox email</Label>
        <CopyInput value={getInboxEmail(inboxId)} />
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col">
          <Collapsible open={form.watch("inbox_forwarding")}>
            <FormField
              control={form.control}
              name="inbox_forwarding"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center w-full mb-4">
                  <FormLabel>Forward email</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <CollapsibleContent>
              <FormField
                control={form.control}
                name="inbox_email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={(evt) =>
                          field.onChange(
                            evt.target.value.length > 0
                              ? evt.target.value
                              : null,
                          )
                        }
                        className="w-full"
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        type="email"
                        placeholder="hello@example.com"
                      />
                    </FormControl>
                    <FormDescription>
                      We will send a copy of the email to this address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="w-full mt-8">
            <Button
              type="submit"
              disabled={action.status === "executing"}
              className="w-full"
            >
              {action.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
