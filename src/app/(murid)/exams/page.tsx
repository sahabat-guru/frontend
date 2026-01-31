"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ExamTimer } from "@/components/features/exams/ExamTimer";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock Questions
const questions = [
	{ id: 1, text: "Apa hasil dari 5 + 5?", options: ["8", "10", "12", "15"] },
	{
		id: 2,
		text: "Ibukota Indonesia adalah?",
		options: ["Bandung", "Surabaya", "Jakarta", "Medan"],
	},
	{
		id: 3,
		text: "Siapa penemu lampu pijar?",
		options: ["Einstein", "Tesla", "Edison", "Newton"],
	},
];

export default function ExamPage() {
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const webcamRef = useRef<Webcam>(null);
	const { toast } = useToast();

	useEffect(() => {
		// Simulate WebSocket event emission/detection
		const interval = setInterval(() => {
			// Here we would capture image and send to backend
			// const imageSrc = webcamRef.current?.getScreenshot();
			// socket.emit('proctor-check', { image: imageSrc });
		}, 5000); // Check every 5s

		return () => clearInterval(interval);
	}, []);

	const handleAnswer = (value: string) => {
		setAnswers({ ...answers, [currentQuestion]: value });
	};

	const handleSubmit = () => {
		toast({
			title: "Exam Submitted",
			description: "Your answers have been recorded.",
		});
		// Redirect or show score
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
			{/* Main Exam Area */}
			<div className="flex-1 flex flex-col gap-6">
				<div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
					<div>
						<h2 className="text-xl font-bold">
							Ujian Pengetahuan Umum
						</h2>
						<p className="text-sm text-muted-foreground">
							Soal {currentQuestion + 1} dari {questions.length}
						</p>
					</div>
					<ExamTimer durationMinutes={30} onTimeUp={handleSubmit} />
				</div>

				<Card className="flex-1">
					<CardContent className="p-8">
						<h3 className="text-lg font-medium mb-6">
							{questions[currentQuestion].text}
						</h3>
						<RadioGroup
							value={answers[currentQuestion]}
							onValueChange={handleAnswer}
							className="space-y-4"
						>
							{questions[currentQuestion].options.map(
								(opt, i) => (
									<div
										key={i}
										className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
									>
										<RadioGroupItem
											value={opt}
											id={`opt-${i}`}
										/>
										<Label
											htmlFor={`opt-${i}`}
											className="flex-1 cursor-pointer"
										>
											{opt}
										</Label>
									</div>
								),
							)}
						</RadioGroup>
					</CardContent>
				</Card>

				<div className="flex justify-between">
					<Button
						variant="outline"
						disabled={currentQuestion === 0}
						onClick={() => setCurrentQuestion((prev) => prev - 1)}
					>
						Previous
					</Button>

					{currentQuestion === questions.length - 1 ? (
						<Button
							onClick={handleSubmit}
							className="bg-gradient-primary"
						>
							Submit Exam
						</Button>
					) : (
						<Button
							onClick={() =>
								setCurrentQuestion((prev) => prev + 1)
							}
						>
							Next
						</Button>
					)}
				</div>
			</div>

			{/* Side Panel (Camera & Nav) */}
			<div className="w-full lg:w-80 space-y-6">
				<Card className="overflow-hidden border-2 border-primary/20">
					<div className="bg-black relative aspect-video">
						<Webcam
							ref={webcamRef}
							audio={false}
							screenshotFormat="image/jpeg"
							className="w-full h-full object-cover"
							mirrored
						/>
						<div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded animate-pulse">
							● REC
						</div>
					</div>
					<div className="p-3 text-xs text-center text-muted-foreground bg-muted/30">
						Camera is active for proctoring
					</div>
				</Card>

				<Card>
					<CardContent className="p-4 grid grid-cols-5 gap-2">
						{questions.map((q, i) => (
							<Button
								key={i}
								size="sm"
								variant={
									i === currentQuestion
										? "default"
										: answers[i]
											? "secondary"
											: "outline"
								}
								className={
									answers[i]
										? "border-green-500 text-green-600"
										: ""
								}
								onClick={() => setCurrentQuestion(i)}
							>
								{i + 1}
							</Button>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
