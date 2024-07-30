"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@map/ui/toast";
import { useToast } from "@map/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={1000}>
      {" "}
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className="bottom-0 right-0 m-4" />{" "}
      {/* Position to top-right */}
    </ToastProvider>
  );
}
