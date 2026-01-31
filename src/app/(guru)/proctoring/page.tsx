"use client";

import { useEffect, useState } from "react";
import { CameraGrid } from "@/components/features/proctoring/CameraGrid";
import { StudentData } from "@/components/features/proctoring/StudentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Fingerprint, ScanFace } from "lucide-react";

// Mock Data
const MOCK_STUDENTS: StudentData[] = [
	{ id: "1", name: "Ahmad Santoso", status: "safe", alerts: [] },
	{
		id: "2",
		name: "Budi Pratama",
		status: "warning",
		alerts: ["Eye gaze away"],
	},
	{
		id: "3",
		name: "Citra Dewi",
		status: "suspicious",
		alerts: ["Multiple faces detected", "Phone detected"],
	},
	{ id: "4", name: "Dewi Lestari", status: "safe", alerts: [] },
	{ id: "5", name: "Eko Prasetyo", status: "safe", alerts: [] },
];

export default function ProctoringPage() {
	const [students, setStudents] = useState<StudentData[]>(MOCK_STUDENTS);
	const [selectedExam, setSelectedExam] = useState("exam-1");

	useEffect(() => {
		// In a real implementation:
		// const socket = getSocket();
		// socket.connect();
		// socket.emit('join-proctor', { examId: selectedExam });
		// socket.on('student-update', (data) => { update student state });

		// Simulation of live updates
		const interval = setInterval(() => {
			setStudents((prev) =>
				prev.map((s) => {
					if (s.id === "2") {
						// Toggle warning for demo
						return {
							...s,
							status: s.status === "warning" ? "safe" : "warning",
							alerts:
								s.status === "warning"
									? []
									: ["Head pose deviation"],
						};
					}
					return s;
				}),
			);
		}, 5000);

		return () => clearInterval(interval);
	}, [selectedExam]);

	const suspiciousCount = students.filter(
		(s) => s.status === "suspicious",
	).length;
	const warningCount = students.filter((s) => s.status === "warning").length;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Smart Proctoring
					</h2>
					<p className="text-muted-foreground">
						Live AI monitoring for active exams.
					</p>
				</div>
				<div className="flex gap-4">
					<Select
						value={selectedExam}
						onValueChange={setSelectedExam}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Select Exam" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="exam-1">
								Ujian Matematika (X-A)
							</SelectItem>
							<SelectItem value="exam-2">
								Ujian Fisika (XI-B)
							</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="destructive">End Exam Session</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-red-600">
							Suspicious Activity
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{suspiciousCount}
						</div>
						<p className="text-xs text-red-600/80">
							Students flagged as high risk
						</p>
					</CardContent>
				</Card>
				<Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-yellow-600">
							Warnings
						</CardTitle>
						<ScanFace className="h-4 w-4 text-yellow-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{warningCount}
						</div>
						<p className="text-xs text-yellow-600/80">
							Minor deviations detected
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Active
						</CardTitle>
						<Fingerprint className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{students.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Students in session
						</p>
					</CardContent>
				</Card>
			</div>

			<CameraGrid students={students} />
		</div>
	);
}
