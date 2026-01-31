"use client";

import { GeneratorForm } from "@/components/features/materials/GeneratorForm";

export default function MaterialPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Lesson & Material Generator
					</h2>
					<p className="text-muted-foreground">
						Generate Lesson Plans (RPP), Slides (PPT), and Quizzes
						in seconds using AI.
					</p>
				</div>
			</div>

			<GeneratorForm />
		</div>
	);
}
