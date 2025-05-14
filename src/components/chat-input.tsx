import { Button } from "@/components/ui/button";
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

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <div className="flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm bg-white w-full">
      <Input
        type="text"
        placeholder="Ask me anything"
        className="flex-1 border-none !ring-0 bg-transparent text-sm placeholder:text-muted-foreground"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <button
        onClick={onAttachFile}
        className="text-muted-foreground hover:text-primary p-1.5 rounded-full transition-colors"
        type="button"
      >
        <FilePlus2 className="h-4 w-4" />
      </button>

      <div className="h-6 border-l" />

      <Button
        size="icon"
        className="bg-[#3A5CCC] hover:bg-[#324EB3] text-white rounded-full"
        onClick={handleSend}
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
