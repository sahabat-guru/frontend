"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
	durationMinutes: number;
	onTimeUp?: () => void;
}

export function ExamTimer({ durationMinutes, onTimeUp }: ExamTimerProps) {
	const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

	useEffect(() => {
		if (timeLeft <= 0) {
			onTimeUp?.();
			return;
		}

		const interval = setInterval(() => {
			setTimeLeft((prev) => prev - 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [timeLeft, onTimeUp]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex items-center gap-2 font-mono text-xl font-bold bg-muted/50 px-4 py-2 rounded-md border">
			<Clock className="h-5 w-5 text-primary" />
			<span
				className={
					timeLeft < 300
						? "text-red-500 animate-pulse"
						: "text-primary"
				}
			>
				{formatTime(timeLeft)}
			</span>
		</div>
	);
}
