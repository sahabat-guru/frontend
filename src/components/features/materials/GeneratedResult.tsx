"use client";

import { useState, useEffect } from "react";
import {
	Download,
	ExternalLink,
	Loader2,
	FileText,
	Presentation,
	BookOpen,
	ClipboardList,
	Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { scoringApi } from "@/lib/scoring-api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface GeneratedResultProps {
	result: any;
	type: "RPP" | "PPT" | "LKPD" | "QUESTIONS" | null;
}

export function GeneratedResult({ result, type }: GeneratedResultProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isCreatingExam, setIsCreatingExam] = useState(false);
	const { toast } = useToast();
	const router = useRouter();

	// Extract URLs from result - check multiple possible property names
	const previewUrl =
		result?.previewUrl ||
		result?.preview_url ||
		result?.data?.previewUrl ||
		result?.data?.preview_url;
	const fileUrl =
		result?.fileUrl ||
		result?.url ||
		result?.data?.fileUrl ||
		result?.data?.url;

	// Debug logging
	useEffect(() => {
		if (result) {
			console.log("GeneratedResult received:", result);
			console.log("Preview URL:", previewUrl);
			console.log("File URL:", fileUrl);
		}
	}, [result, previewUrl, fileUrl]);

	const handleDownload = () => {
		if (fileUrl) {
			window.open(fileUrl, "_blank");
		}
	};

	// Create exam from QUESTIONS material
	const handleCreateExam = async () => {
		if (!result?.id) {
			toast({
				title: "Gagal membuat ujian",
				description: "ID material tidak ditemukan.",
				variant: "destructive",
			});
			return;
		}

		setIsCreatingExam(true);
		try {
			const exam = await scoringApi.createExamFromMaterial(result.id);
			toast({
				title: "Ujian berhasil dibuat!",
				description: `Ujian "${exam.title}" berhasil dibuat dari soal yang di-generate.`,
			});
			// Redirect to scoring page
			router.push(`/scoring`);
		} catch (err) {
			console.error("Failed to create exam:", err);
			toast({
				title: "Gagal membuat ujian",
				description: "Terjadi kesalahan saat membuat ujian dari soal.",
				variant: "destructive",
			});
		} finally {
			setIsCreatingExam(false);
		}
	};

	if (!result) {
		return (
			<div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px] bg-white rounded-xl">
				<div className="flex flex-col items-center gap-3">
					{type === "PPT" ? (
						<Presentation className="h-16 w-16 text-gray-300" />
					) : type === "LKPD" ? (
						<BookOpen className="h-16 w-16 text-gray-300" />
					) : type === "QUESTIONS" ? (
						<ClipboardList className="h-16 w-16 text-gray-300" />
					) : (
						<FileText className="h-16 w-16 text-gray-300" />
					)}
					<p className="text-gray-500 font-medium text-center px-4">
						{type === "RPP"
							? 'Klik "Generate RPP" untuk melihat hasil'
							: type === "PPT"
								? 'Klik "Generate PPT" untuk membuat slide'
								: type === "LKPD"
									? 'Klik "Generate LKPD" untuk membuat lembar kerja'
									: type === "QUESTIONS"
										? 'Klik "Generate Soal" untuk membuat bank soal'
										: "Klik Generate untuk melihat hasil"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full overflow-hidden bg-white rounded-xl">
			{/* Header with buttons */}
			<div className="p-3 flex items-center justify-between border-b bg-gray-50/50">
				<div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
					{type === "PPT" ? (
						<Presentation className="h-4 w-4 text-purple-500" />
					) : type === "LKPD" ? (
						<BookOpen className="h-4 w-4 text-orange-500" />
					) : type === "QUESTIONS" ? (
						<ClipboardList className="h-4 w-4 text-green-500" />
					) : (
						<FileText className="h-4 w-4 text-blue-500" />
					)}
					<span>Hasil Generate</span>
				</div>
				<div className="flex gap-2">
					{previewUrl && (
						<Button
							size="sm"
							variant="outline"
							className="text-xs h-8"
							onClick={() => window.open(previewUrl, "_blank")}
						>
							<ExternalLink className="h-3 w-3 mr-1" />
							Tab Baru
						</Button>
					)}
					<Button
						size="sm"
						onClick={handleDownload}
						disabled={!fileUrl}
						className="bg-gradient-to-r from-[#6ACBE0] to-[#85E0A3] hover:opacity-90 text-white border-0 text-xs h-8"
					>
						<Download className="h-3 w-3 mr-1" />
						Download
					</Button>
					{/* Create Exam button - only for QUESTIONS type */}
					{type === "QUESTIONS" && result?.id && (
						<Button
							size="sm"
							onClick={handleCreateExam}
							disabled={isCreatingExam}
							className="bg-gradient-to-r from-[#6E2CF4] to-[#0093E9] hover:opacity-90 text-white border-0 text-xs h-8"
						>
							{isCreatingExam ? (
								<Loader2 className="h-3 w-3 mr-1 animate-spin" />
							) : (
								<Plus className="h-3 w-3 mr-1" />
							)}
							Buat Ujian
						</Button>
					)}
				</div>
			</div>

			{/* Preview Content */}
			<div
				className="flex-1 overflow-hidden relative bg-gray-100"
				style={{ minHeight: "500px" }}
			>
				{previewUrl ? (
					<>
						{isLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="h-10 w-10 animate-spin text-[#6ACBE0]" />
									<p className="text-gray-500 font-medium">
										Memuat preview...
									</p>
								</div>
							</div>
						)}
						<iframe
							src={previewUrl}
							className="w-full h-full border-0"
							style={{ minHeight: "500px" }}
							title="Document Preview"
							onLoad={() => setIsLoading(false)}
							onError={() => setIsLoading(false)}
							allow="autoplay"
						/>
					</>
				) : (
					// Fallback when no preview URL - show success message
					<div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6">
						<div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center max-w-md">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-8 h-8 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-green-800 mb-2">
								{result.title || "Materi Berhasil Dibuat!"}
							</h3>
							<p className="text-green-600 text-sm mb-4">
								File berhasil di-generate. Klik "Download" untuk
								mengunduh file.
							</p>
							{fileUrl && (
								<Button
									onClick={handleDownload}
									className="bg-green-600 hover:bg-green-700 text-white"
								>
									<Download className="h-4 w-4 mr-2" />
									Download File
								</Button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
