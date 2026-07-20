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
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
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
          // Mobile: bottom-sheet style (near full screen)
          "fixed inset-x-0 bottom-0 z-50 w-full",
          "rounded-t-2xl",
          "max-h-[95dvh]",
          // Desktop: centered dialog
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:rounded-2xl sm:max-h-[90dvh]",
          // Common
          "ds-glass-strong ds-animate-scale p-0 shadow-[var(--ds-shadow-lg)]",
          "flex flex-col overflow-hidden outline-none",
          // Sizes (desktop only)
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
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
        "shrink-0 flex flex-col gap-1.5 border-b border-border/50 px-5 py-4 text-left sm:px-6 sm:py-5",
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
        "shrink-0 flex flex-col-reverse gap-2 border-t border-border/50",
        "bg-[hsl(var(--ds-glass-bg-strong))]/40 px-5 py-3 sm:px-6 sm:py-4",
        "sm:flex-row sm:justify-end",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
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
        "relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5",
        className,
      )}
      style={{ WebkitOverflowScrolling: "touch" }}
      {...props}
    >
      {showClose && (
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-lg sm:right-4 sm:top-4"
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
