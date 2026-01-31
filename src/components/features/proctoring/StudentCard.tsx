"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, User, CheckCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudentStatus = "safe" | "warning" | "suspicious";

export interface StudentData {
	id: string;
	name: string;
	status: StudentStatus;
	alerts: string[];
	image?: string; // Snapshot or stream URL
}

interface StudentCardProps {
	student: StudentData;
}

export function StudentCard({ student }: StudentCardProps) {
	const statusColor = {
		safe: "border-green-500/50 bg-green-500/5",
		warning: "border-yellow-500/50 bg-yellow-500/5",
		suspicious: "border-red-500/50 bg-red-500/5",
	};

	const badgeVariant = {
		safe: "default", // We'll override color
		warning: "secondary",
		suspicious: "destructive",
	} as const;

	return (
		<Card
			className={cn(
				"overflow-hidden border-2 transition-all",
				statusColor[student.status],
			)}
		>
			<div className="relative aspect-video bg-muted flex items-center justify-center">
				{student.image ? (
					// Mocking a live feed with an image for now
					// In real WebRTC, this would be a <video> element
					<img
						src={student.image}
						alt={student.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<User className="h-12 w-12 text-muted-foreground/50" />
				)}

				<div className="absolute top-2 right-2">
					<Badge
						variant={
							badgeVariant[student.status] === "default"
								? "secondary"
								: badgeVariant[student.status]
						}
						className={cn(
							student.status === "safe" &&
								"bg-green-500 hover:bg-green-600 text-white",
							student.status === "warning" &&
								"bg-yellow-500 hover:bg-yellow-600 text-white",
						)}
					>
						{student.status.toUpperCase()}
					</Badge>
				</div>
			</div>

			<div className="p-3">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarFallback>{student.name[0]}</AvatarFallback>
						</Avatar>
						<span className="font-medium text-sm truncate">
							{student.name}
						</span>
					</div>
					{student.status === "safe" ? (
						<CheckCircle className="h-4 w-4 text-green-500" />
					) : (
						<AlertCircle
							className={cn(
								"h-4 w-4",
								student.status === "suspicious"
									? "text-red-500"
									: "text-yellow-500",
							)}
						/>
					)}
				</div>

				<div className="space-y-1">
					{student.alerts.length > 0 ? (
						student.alerts.map((alert, i) => (
							<div
								key={i}
								className="text-xs text-red-500 flex items-center gap-1"
							>
								<Eye className="h-3 w-3" /> {alert}
							</div>
						))
					) : (
						<div className="text-xs text-muted-foreground">
							No active alerts
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
