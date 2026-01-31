"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileJson, FileText, Download, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedMaterial {
	slide_content?: any;
	rpp_content?: any;
	quiz_content?: any;
	[key: string]: any;
}

export function GeneratorForm() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<GeneratedMaterial | null>(null);
	const { toast } = useToast();

	const [formData, setFormData] = useState({
		topic: "",
		grade: "",
		subject: "",
		audience_type: "students", // Default
	});

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleGenerate = async () => {
		if (!formData.topic || !formData.grade || !formData.subject) {
			toast({
				title: "Missing Information",
				description: "Please fill in all fields.",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);
		setResult(null);

		// Prepare prompt or payload expected by the AI service
		// Assuming the service expects a 'prompt' or specific fields.
		// Based on user request: mapel, kelas, topik.
		const payload = {
			message: `Buatkan materi presentasi (PPT), RPP, dan latihan soal untuk mata pelajaran ${formData.subject} kelas ${formData.grade} dengan topik "${formData.topic}". Output dalam format JSON terstruktur.`,
			// Add explicit fields if the API supports them directly
			topic: formData.topic,
			grade: formData.grade,
			subject: formData.subject,
		};

		try {
			const response = await axios.post(
				"https://ppt-generator-service-865275048150.asia-southeast2.run.app/",
				payload,
			);

			console.log("AI Response:", response.data);
			setResult(response.data);

			toast({
				title: "Success",
				description: "Material generated successfully!",
			});
		} catch (error) {
			console.error("Generation error:", error);
			toast({
				title: "Error",
				description: "Failed to generate material. Please try again.",
				variant: "destructive",
			});
			// Mock data for fallback testing if API fails/is offline
			setResult({
				title: formData.topic,
				slides: [
					{
						title: "Pengenalan",
						content: "Materi dasar tentang " + formData.topic,
					},
					{
						title: "Konsep Utama",
						content: "Penjelasan mendalam...",
					},
				],
				rpp: "Rencana Pelaksanaan Pembelajaran...",
				quiz: [
					{
						question: "Apa itu...?",
						options: ["A", "B"],
						answer: "A",
					},
				],
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
			{/* Form Section */}
			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="text-xl text-primary flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Generate Material
					</CardTitle>
					<CardDescription>
						Create PPT, RPP, and Quizzes instantly with AI.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Subject (Mata Pelajaran)</Label>
						<Input
							placeholder="e.g. Matematika, Biologi"
							value={formData.subject}
							onChange={(e) =>
								handleChange("subject", e.target.value)
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>Grade (Kelas)</Label>
						<Select
							onValueChange={(val) => handleChange("grade", val)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Grade" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="SD Kelas 1-6">
									SD (Kelas 1-6)
								</SelectItem>
								<SelectItem value="SMP Kelas 7-9">
									SMP (Kelas 7-9)
								</SelectItem>
								<SelectItem value="SMA Kelas 10-12">
									SMA (Kelas 10-12)
								</SelectItem>
								<SelectItem value="Mahasiswa">
									Mahasiswa
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Topic</Label>
						<Input
							placeholder="e.g. Hukum Newton, Sistem Pencernaan"
							value={formData.topic}
							onChange={(e) =>
								handleChange("topic", e.target.value)
							}
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
						onClick={handleGenerate}
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Generating...
							</>
						) : (
							"Generate Materials"
						)}
					</Button>
				</CardFooter>
			</Card>

			{/* Result Section */}
			<div className="flex flex-col h-full overflow-hidden bg-card rounded-lg border shadow-sm">
				<div className="p-4 border-b flex items-center justify-between bg-muted/30">
					<div className="flex items-center gap-2 font-semibold">
						<FileJson className="h-5 w-5 text-secondary" />
						Generated Output
					</div>
					{result && (
						<div className="flex gap-2">
							<Button size="sm" variant="outline">
								<Save className="h-4 w-4 mr-2" />
								Save
							</Button>
							<Button size="sm">
								<Download className="h-4 w-4 mr-2" />
								Download PDF
							</Button>
						</div>
					)}
				</div>

				<div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
					{result ? (
						<Tabs defaultValue="json" className="w-full">
							<TabsList className="mb-4">
								<TabsTrigger value="preview">
									Preview
								</TabsTrigger>
								<TabsTrigger value="json">JSON Raw</TabsTrigger>
							</TabsList>
							<TabsContent
								value="preview"
								className="prose dark:prose-invert max-w-none"
							>
								<div className="p-4 bg-white dark:bg-card rounded border">
									<h3 className="text-lg font-bold text-primary mb-2">
										Subject: {formData.subject}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Topic: {formData.topic}
									</p>

									{/* Simple rendering of known structures if API returns specific keys */}
									{result.slides && (
										<div className="mb-6">
											<h4 className="font-semibold text-secondary">
												Slides Preview
											</h4>
											<ul className="list-disc pl-5">
												{Array.isArray(result.slides) &&
													result.slides.map(
														(
															slide: any,
															idx: number,
														) => (
															<li
																key={idx}
																className="mb-2"
															>
																<strong>
																	{slide.title ||
																		`Slide ${idx + 1}`}
																</strong>
																:{" "}
																{slide.content}
															</li>
														),
													)}
											</ul>
										</div>
									)}

									{/* Fallback for unstructured text if API returns plain text */}
									{typeof result === "string" && (
										<p className="whitespace-pre-wrap">
											{result}
										</p>
									)}
								</div>
							</TabsContent>
							<TabsContent value="json">
								<pre className="text-xs font-mono p-4 bg-slate-900 text-green-400 rounded-lg overflow-auto max-h-[500px]">
									{JSON.stringify(result, null, 2)}
								</pre>
							</TabsContent>
						</Tabs>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-muted-foreground">
							<div className="p-6 rounded-full bg-muted mb-4">
								<FileText className="h-10 w-10 opacity-50" />
							</div>
							<p>No material generated yet.</p>
							<p className="text-sm">
								Fill the form and click generate to start.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
