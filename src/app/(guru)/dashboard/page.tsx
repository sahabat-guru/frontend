"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Users, BookOpen, Video, Activity } from "lucide-react";

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent w-fit">
					Teacher Dashboard
				</h2>
				<p className="text-muted-foreground">
					Overview of your classroom activities and material
					generation.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Exams
						</CardTitle>
						<Video className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">3</div>
						<p className="text-xs text-muted-foreground">
							+1 started within the last hour
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Materials Generated
						</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
						<p className="text-xs text-muted-foreground">
							+4 from last week
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Students Online
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">24</div>
						<p className="text-xs text-muted-foreground">
							Currently active
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Average Score
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">84.5</div>
						<p className="text-xs text-muted-foreground">
							+2.1% from last exam
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Placeholder for Recent Activity or Charts */}
			<Card className="col-span-4">
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Latest actions taken in your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No recent activity to show.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
