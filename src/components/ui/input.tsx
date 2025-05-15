// input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface MultilineInputProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "type" | "onSubmit" // type is not for textarea, onSubmit is for forms
  > {
  onEnterSubmit?: () => void; // Callback for when Enter (without Shift) is pressed
  initialHeight?: string; // e.g., "36px" or "40px"
  maxHeight?: number; // e.g., 108 (for approx 3 lines of 36px height)
}

const Input = React.forwardRef<HTMLTextAreaElement, MultilineInputProps>(
  (
    {
      className,
      value,
      onChange,
      onKeyDown,
      onEnterSubmit,
      initialHeight = "36px", // Default to roughly h-9
      maxHeight = 108, // Default to roughly 3 lines
      ...props // other textarea attributes like placeholder, disabled, etc.
    },
    ref
  ) => {
    const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Combine internal ref with forwarded ref
    React.useImperativeHandle(ref, () => internalTextareaRef.current!, []);

    // Auto-resizing logic
    React.useEffect(() => {
      const textarea = internalTextareaRef.current;
      if (textarea) {
        textarea.style.height = "auto"; // Reset height to correctly calculate scrollHeight
        let newHeight = textarea.scrollHeight;
        const minHeightNum = parseInt(initialHeight, 10) || 0;

        // Ensure minimum height
        if (newHeight < minHeightNum) {
          newHeight = minHeightNum;
        }

        // Apply max height
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          textarea.style.overflowY = "auto"; // Show scrollbar if content exceeds max height
        } else {
          textarea.style.overflowY = "hidden"; // Hide scrollbar if content is within max height
        }
        textarea.style.height = `${newHeight}px`;
      }
    }, [value, initialHeight, maxHeight]); // Recalculate on value or config change

    // Set initial height style on mount and when initialHeight/value changes affecting reset
    React.useEffect(() => {
        const textarea = internalTextareaRef.current;
        if (textarea) {
            if (!value) { // When value is empty (e.g. after submit or initially)
                textarea.style.height = initialHeight;
                textarea.style.overflowY = "hidden";
            }
            // The other useEffect handles growing from this state if value is then typed.
        }
    }, [value, initialHeight]);


    const handleKeyDownInternal = (
      e: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          // Allow Shift+Enter to insert a newline (default textarea behavior)
          // onChange prop will handle the state update with the new newline character
        } else {
          // Prevent default Enter behavior (inserting a newline in textarea)
          e.preventDefault();
          if (onEnterSubmit) {
            onEnterSubmit();
          }
        }
      }
      // Call external onKeyDown if provided by parent
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    // Base classes adapted for a textarea from original Input component.
    // Removed h-9 (as height is dynamic) and file:* specific classes.
    const defaultTextareaClasses = cn(
      "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      "resize-none" // Important for controlled auto-resizing
    );

    return (
      <textarea
        ref={internalTextareaRef}
        data-slot="input" // Keep data-slot if used by a styling system
        className={cn(defaultTextareaClasses, className)}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDownInternal}
        style={{
          minHeight: initialHeight, // Apply minimum height
          height: initialHeight,    // Initial height, will be adjusted by useEffect
        }}
        rows={1} // Semantic hint for a single line initially; actual display controlled by height
        {...props}
      />
    );
  }
);

Input.displayName = "Input"; // Keeping the name "Input" as requested

export { Input };