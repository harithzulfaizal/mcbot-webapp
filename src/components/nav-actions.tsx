import { MessageSquareMore } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NavActions({
	onNewConversation,
}: {
	onNewConversation: () => void;
}) {
	return (
		<div className="flex items-center gap-2 text-sm">
			<Button
				variant="outline"
				size="icon"
				className="h-7 w-45"
				onClick={onNewConversation}
			>
				<MessageSquareMore />
				New Conversation
			</Button>
		</div>
	);
}
