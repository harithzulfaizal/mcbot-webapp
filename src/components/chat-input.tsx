// ChatInput.tsx
import { Button } from "@/components/ui/button";
// Ensure this path points to your modified Input.tsx
import { Input } from "@/components/ui/input";
import { FilePlus2, SendHorizontal } from "lucide-react";
import { useState } from "react";

export function ChatInput({
  onSendMessage,
  onAttachFile,
}: {
  onSendMessage: (msg: string) => void;
  onAttachFile?: () => void;
}) {
  const [message, setMessage] = useState("");

  const handleSendMessageAndClear = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
    // The Input component's useEffect will handle resetting its height
    // when the `value` (message) becomes empty.
  };

  return (
    <div className="flex items-center gap-2 rounded-full px-4 py-2 shadow-sm bg-transparent w-full">
      {/* The Input component below is the modified one that renders a textarea
        and handles auto-resizing and Enter/Shift+Enter.
      */}
      <Input
        placeholder="Ask me anything"
        // Apply specific styling for ChatInput.
        // !py-2 results in 0.5rem (8px) padding top/bottom.
        // Combined with text-sm (20px line-height), one line is 36px tall.
        className="flex-1 items-center !border-none !shadow-none !ring-0 bg-transparent text-sm placeholder:text-muted-foreground px-3 !py-2"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onEnterSubmit={handleSendMessageAndClear}
        initialHeight="36px"
        maxHeight={50} 
      />

      <button
        onClick={onAttachFile}
        className="text-muted-foreground hover:text-primary p-1.5 rounded-full transition-colors"
        type="button"
        aria-label="Attach file"
      >
        <FilePlus2 className="h-4 w-4" />
      </button>

      {/* This separator has a fixed height. If the input grows to 3 lines (108px),
        this h-6 (24px) separator might look short. Consider alternatives if this is an issue:
        - Making its height dynamic.
        - Using `align-self: stretch` if its direct parent was also a flex container oriented appropriately.
        - Removing it or integrating separation differently.
      */}
      <div className="h-6 border-l" />

      <Button
        size="icon"
        className="bg-[#3A5CCC] hover:bg-[#324EB3] text-white rounded-full"
        onClick={handleSendMessageAndClear}
        aria-label="Send message"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}