import {
	SidebarMenu,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<div className="px-1.5 pt-1">
					<div className="h-16 w-full overflow-hidden">
						<img
							src="/mcbot2.png"
							alt="MC Bot"
							className="h-full w-full object-cover object-center"
						/>
					</div>
				</div>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
