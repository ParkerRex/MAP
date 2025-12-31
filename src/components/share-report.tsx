"use client";

// TODO: Implement createReportAction in @/actions/report/create-report-action
// import { createReportAction } from "@/actions/report/create-report-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CopyInput } from "./copy-input";

const formSchema = z.object({
  expireAt: z.date().optional(),
});

type Props = {
  defaultValue: {
    from: string;
    to: string;
  };
  type: "profit" | "revenue";
  currency: string;
};

export function ShareReport({ defaultValue, type, currency }: Props) {
  const [isOpen, setOpen] = useState(false);
  const { toast, dismiss } = useToast();

  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? defaultValue.from;
  const to = searchParams?.get("to") ?? defaultValue.to;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    // TODO: Implement actual createReport action
    createReport.execute({
      baseUrl: window.location.origin,
      from,
      to,
      type,
      expiresAt: data.expireAt && new Date(data.expireAt).toISOString(),
      currency,
    });
  }

  // Stub out createReport action
  const createReport = {
    execute: (params: any) => {
      console.log("Creating report with params:", params);
      setTimeout(() => {
        setOpen(false);
        const { id } = toast({
          title: "Report published",
          description: "Your report is ready to share.",
          variant: "success",
          footer: (
            <div className="mt-4 space-x-2 flex w-full">
              <CopyInput
                value="https://example.com/fake-short-link"
                className="border-[#2C2C2C] w-full"
              />
              <Link
                href="https://example.com/fake-short-link"
                onClick={() => dismiss(id)}
              >
                <Button>View</Button>
              </Link>
            </div>
          ),
        });
      }, 1000);
    },
    status: "idle" as "idle" | "executing",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)} size="icon">
        <Icons.Share size={16} />
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-4 space-y-8"
          >
            <DialogHeader>
              <DialogTitle>Share report</DialogTitle>
              <DialogDescription>
                Share a report from the period.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="expireAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline">
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Expire at</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    A date when the report link will expire.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={createReport.status === "executing"}
                className="w-full"
              >
                {createReport.status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Publish"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
