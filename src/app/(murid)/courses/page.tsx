"use client";

import { useEffect, useState } from "react";
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
import { BookOpen, FileText, PlayCircle, FolderOpen } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type Material = {
	id: string;
	title: string;
	type: "PPT" | "RPP" | "LKPD" | "QUESTIONS";
	contentJson: any;
	metadata: any;
	fileUrl?: string;
	previewUrl?: string;
	isPublished: boolean;
	createdAt: string;
};

export default function CoursesPage() {
	const [materials, setMaterials] = useState<Material[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMaterials = async () => {
			try {
				const response = await api.get("/materials", {
					params: {
						excludeType: "QUESTIONS",
					},
				});
				if (response.data.success) {
					setMaterials(response.data.data);
				}
			} catch (error) {
				console.error("Failed to fetch materials:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchMaterials();
	}, []);

	const getIcon = (type: string) => {
		switch (type) {
			case "PPT":
				return <PlayCircle className="h-12 w-12 text-muted-foreground/50" />;
			case "RPP":
				return <FileText className="h-12 w-12 text-muted-foreground/50" />;
			case "LKPD":
				return <BookOpen className="h-12 w-12 text-muted-foreground/50" />;
			default:
				return <FolderOpen className="h-12 w-12 text-muted-foreground/50" />;
		}
	};

	const getSubject = (item: Material) => {
		return (
			item.metadata?.mata_pelajaran ||
			item.metadata?.topic ||
			item.metadata?.kurikulum ||
			"General"
		);
	};

	const getDescription = (item: Material) => {
		// Use title as fallback if no description is available (since DB doesn't have explicit description column for materials table shown in schema earlier, only title)
		// Or check contentJson if it has summary
		return item.title;
	};

	if (loading) {
		return <div className="p-8 text-center">Loading courses...</div>;
	}

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

			{materials.length === 0 ? (
				<div className="text-center py-12 border rounded-lg bg-muted/20">
					<p className="text-muted-foreground">No materials found.</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{materials.map((item) => (
						<Card key={item.id} className="flex flex-col">
							<CardHeader>
								<div className="flex justify-between items-start">
									<Badge variant="outline" className="mb-2">
										{getSubject(item)}
									</Badge>
									<Badge className="bg-blue-500">
										{item.type}
									</Badge>
								</div>
								<CardTitle className="text-xl">
									{item.title}
								</CardTitle>
								<CardDescription className="line-clamp-2">
									{getDescription(item)}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-1">
								<div className="h-32 bg-muted/50 rounded-md flex items-center justify-center">
									{getIcon(item.type)}
								</div>
							</CardContent>
							<CardFooter>
								{(item.fileUrl || item.previewUrl) ? (
									<Link
										href={item.previewUrl || item.fileUrl || "#"}
										target="_blank"
										className="w-full"
									>
										<Button variant="outline" className="w-full">
											View Material
										</Button>
									</Link>
								) : (
									<Button variant="outline" className="w-full" disabled>
										No Link Available
									</Button>
								)}
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
