import { createContext, useContext, useState, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

function SheetTrigger({ children, asChild = false }: SheetTriggerProps) {
  const context = useContext(SheetContext);
  if (!context) throw new Error("SheetTrigger must be used within Sheet");

  if (asChild) {
    return (
      <div onClick={() => context.setOpen(true)}>
        {children}
      </div>
    );
  }

  return (
    <button onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
}

interface SheetContentProps {
  children: ReactNode;
  className?: string;
  side?: "left" | "right" | "top" | "bottom";
}

function SheetContent({ children, className, side = "right" }: SheetContentProps) {
  const context = useContext(SheetContext);
  if (!context) throw new Error("SheetContent must be used within Sheet");

  if (!context.open) return null;

  const sideClasses = {
    right: "right-0 top-0 h-full w-full sm:max-w-lg",
    left: "left-0 top-0 h-full w-full sm:max-w-lg",
    top: "top-0 left-0 w-full h-full sm:max-h-[85vh]",
    bottom: "bottom-0 left-0 w-full h-full sm:max-h-[85vh]",
  };

  const slideClasses = {
    right: context.open ? "translate-x-0" : "translate-x-full",
    left: context.open ? "translate-x-0" : "-translate-x-full",
    top: context.open ? "translate-y-0" : "-translate-y-full",
    bottom: context.open ? "translate-y-0" : "translate-y-full",
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => context.setOpen(false)}
      />

      {/* Content */}
      <div
        className={cn(
          "fixed z-50 bg-card border-l border-border shadow-lg transition-transform duration-300 ease-in-out",
          sideClasses[side],
          slideClasses[side],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => context.setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

interface SheetHeaderProps {
  children: ReactNode;
  className?: string;
}

function SheetHeader({ children, className }: SheetHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-2 px-6 py-6 border-b border-border", className)}>
      {children}
    </div>
  );
}

interface SheetTitleProps {
  children: ReactNode;
  className?: string;
}

function SheetTitle({ children, className }: SheetTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

interface SheetDescriptionProps {
  children: ReactNode;
  className?: string;
}

function SheetDescription({ children, className }: SheetDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

interface SheetFooterProps {
  children: ReactNode;
  className?: string;
}

function SheetFooter({ children, className }: SheetFooterProps) {
  return (
    <div className={cn("flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/20", className)}>
      {children}
    </div>
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter };
