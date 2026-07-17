"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-plum-950/35 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn("fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l bg-background p-0 shadow-soft sm:max-w-xl data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right", className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 z-10 flex size-9 items-center justify-center rounded-full border bg-white text-muted-foreground shadow-sm transition-colors hover:text-plum-800">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("border-b bg-white/80 px-6 py-6 pr-16 backdrop-blur", className)} {...props} />;
const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("px-6 py-6", className)} {...props} />;
const SheetTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  ({ className, ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn("text-xl font-semibold tracking-[-.02em]", className)} {...props} />,
);
SheetTitle.displayName = DialogPrimitive.Title.displayName;
const SheetDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(
  ({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn("mt-1 text-sm leading-relaxed text-muted-foreground", className)} {...props} />,
);
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody, SheetTitle, SheetDescription };
