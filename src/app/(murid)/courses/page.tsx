"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";

const materials = [
	{
		id: 1,
		title: "Hukum Newton",
		type: "PPT",
		subject: "Fisika",
		description: "Slide presentasi tentang hukum gerak Newton 1, 2, dan 3.",
	},
	{
		id: 2,
		title: "Sistem Pencernaan",
		type: "RPP",
		subject: "Biologi",
		description:
			"Rencana pembelajaran lengkap untuk bab sistem pencernaan.",
	},
	{
		id: 3,
		title: "Latihan Soal Aljabar",
		type: "Quiz",
		subject: "Matematika",
		description:
			"10 soal pilihan ganda untuk melatih pemahaman aljabar dasar.",
	},
];

export default function CoursesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					My Courses & Materials
				</h2>
				<p className="text-muted-foreground">
					Access learning materials and prepare for exams.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{materials.map((item) => (
					<Card key={item.id} className="flex flex-col">
						<CardHeader>
							<div className="flex justify-between items-start">
								<Badge variant="outline" className="mb-2">
									{item.subject}
								</Badge>
								<Badge
									className={
										item.type === "Quiz"
											? "bg-orange-500"
											: "bg-blue-500"
									}
								>
									{item.type}
								</Badge>
							</div>
							<CardTitle className="text-xl">
								{item.title}
							</CardTitle>
							<CardDescription>
								{item.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1">
							{/* Thumbnail or Icon */}
							<div className="h-32 bg-muted/50 rounded-md flex items-center justify-center">
								{item.type === "PPT" && (
									<PlayCircle className="h-12 w-12 text-muted-foreground/50" />
								)}
								{item.type === "RPP" && (
									<FileText className="h-12 w-12 text-muted-foreground/50" />
								)}
								{item.type === "Quiz" && (
									<BookOpen className="h-12 w-12 text-muted-foreground/50" />
								)}
							</div>
						</CardContent>
						<CardFooter>
							{item.type === "Quiz" ? (
								<Link href="/exams" className="w-full">
									<Button className="w-full">
										Start Quiz
									</Button>
								</Link>
							) : (
								<Button variant="outline" className="w-full">
									View Material
								</Button>
							)}
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
