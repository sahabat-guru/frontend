"use client";

import { StudentCard, StudentData } from "./StudentCard";

interface CameraGridProps {
	students: StudentData[];
}

export function CameraGrid({ students }: CameraGridProps) {
	if (students.length === 0) {
		return (
			<div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
				No students connected to this exam session.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{students.map((student) => (
				<StudentCard key={student.id} student={student} />
			))}
		</div>
	);
}
