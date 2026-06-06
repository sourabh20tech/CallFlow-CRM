"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;
const ModalPortal = DialogPrimitive.Portal;

const ModalOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50",
      "data-[state=open]:animate-[ds-fade-in_200ms_ease_both]",
      "data-[state=closed]:opacity-0",
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg";
    /** Constrains height and enables header/body/footer scroll layout */
    scrollable?: boolean;
  }
>(({ className, children, size = "md", scrollable = false, ...props }, ref) => {
  const { "aria-describedby": ariaDescribedBy, ...contentProps } = props;

  return (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-describedby={ariaDescribedBy ?? undefined}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
        "ds-glass-strong ds-animate-scale rounded-2xl p-0 shadow-[var(--ds-shadow-lg)]",
        "max-h-[92dvh] overflow-y-auto",
        "outline-none",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-2xl",
        scrollable && "flex max-h-[min(90dvh,800px)] flex-col overflow-hidden",
        className,
      )}
      {...contentProps}
    >
      {children}
    </DialogPrimitive.Content>
  </ModalPortal>
  );
});
ModalContent.displayName = DialogPrimitive.Content.displayName;

function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-col gap-1.5 border-b border-border/50 px-6 py-5 text-left",
        className,
      )}
      {...props}
    />
  );
}

function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-col-reverse gap-2 border-t border-border/50 bg-[hsl(var(--ds-glass-bg-strong))]/40 px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

const ModalTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("ds-h3", className)} {...props} />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("ds-body text-muted-foreground", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  showClose?: boolean;
  /** Scrollable middle section inside a scrollable ModalContent */
  scrollable?: boolean;
}

function ModalBody({
  className,
  children,
  onClose,
  showClose = true,
  scrollable = false,
  ...props
}: ModalBodyProps) {
  return (
    <div
      className={cn(
        "relative px-6 py-5",
        scrollable && "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    >
      {showClose && (
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 rounded-lg"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogPrimitive.Close>
      )}
      {children}
    </div>
  );
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalBody,
};
