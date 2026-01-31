"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, FileText, AlertCircle } from "lucide-react";

const submissions = [
	{
		id: 1,
		student: "Ahmad Santoso",
		exam: "Ujian Matematika",
		score: 85,
		status: "done",
		aiConfidence: "High",
	},
	{
		id: 2,
		student: "Budi Pratama",
		exam: "Ujian Matematika",
		score: 72,
		status: "processing",
		aiConfidence: "Medium",
	},
	{
		id: 3,
		student: "Citra Dewi",
		exam: "Ujian Fisika",
		score: 0,
		status: "flagged",
		aiConfidence: "Low",
	},
	{
		id: 4,
		student: "Dewi Lestari",
		exam: "Ujian Matematika",
		score: 90,
		status: "done",
		aiConfidence: "High",
	},
];

export default function ScoringPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					Automated Scoring
				</h2>
				<p className="text-muted-foreground">
					Review and approve AI-generated scores.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Review
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Auto-Graded Today
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">45</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Accuracy Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">94%</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Submissions</CardTitle>
					<CardDescription>
						List of student exam submissions and their grading
						status.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead>Exam</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>AI Score</TableHead>
								<TableHead>Confidence</TableHead>
								<TableHead className="text-right">
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{submissions.map((sub) => (
								<TableRow key={sub.id}>
									<TableCell className="font-medium">
										{sub.student}
									</TableCell>
									<TableCell>{sub.exam}</TableCell>
									<TableCell>
										<Badge
											variant={
												sub.status === "done"
													? "secondary"
													: sub.status === "flagged"
														? "destructive"
														: "outline"
											}
										>
											{sub.status === "done" && (
												<CheckCircle className="mr-1 h-3 w-3" />
											)}
											{sub.status === "processing" && (
												<Clock className="mr-1 h-3 w-3" />
											)}
											{sub.status === "flagged" && (
												<AlertCircle className="mr-1 h-3 w-3" />
											)}
											{sub.status.toUpperCase()}
										</Badge>
									</TableCell>
									<TableCell className="font-bold">
										{sub.score > 0 ? sub.score : "-"}
									</TableCell>
									<TableCell>
										<span
											className={
												sub.aiConfidence === "High"
													? "text-green-600"
													: "text-yellow-600"
											}
										>
											{sub.aiConfidence}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="sm">
											<FileText className="h-4 w-4 mr-2" />
											Review
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
