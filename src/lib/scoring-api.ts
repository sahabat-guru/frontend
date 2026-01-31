import { api } from "./api";

// Types for scoring API
export interface ExamListItem {
	id: string;
	title: string;
	description?: string;
	status: "DRAFT" | "ONGOING" | "FINISHED" | "PUBLISHED";
	startTime?: string;
	endTime?: string;
	duration?: number;
	createdAt: string;
	stats?: {
		average: number;
		highest: number;
		lowest: number;
		submitted: number;
		scored: number;
		total: number;
	};
}

export interface ParticipantScore {
	id: string;
	student: {
		id: string;
		name: string;
		email: string;
	};
	startTime?: string;
	submitTime?: string;
	score: number | null;
	status: string;
	answersCount: number;
}

export interface ExamScoresResponse {
	participants: ParticipantScore[];
	stats: {
		average: number;
		highest: number;
		lowest: number;
		submitted: number;
		scored: number;
		total: number;
	};
}

export interface AIFeedback {
	overall: string;
	strengths: string[];
	improvements: string[];
	rubric_breakdown?: Record<string, number>;
	total_points?: number;
	max_points?: number;
	extracted_text?: string; // OCR extracted text for image-based answers
}

export interface AnswerDetail {
	id: string;
	questionId: string;
	answerText?: string;
	answerFileUrl?: string;
	aiScore: number | null;
	finalScore: number | null;
	feedback: string | null; // JSON string of AIFeedback
	status: "PENDING" | "SCORED";
	question: {
		id: string;
		type: "PG" | "ESSAY";
		question: string;
		options?: Record<string, string>;
		answerKey?: string;
		difficulty?: string;
	};
}

export interface ParticipantAnswersResponse {
	participant: ParticipantScore;
	answers: AnswerDetail[];
}

export interface ScoringStatusResponse {
	pending: number;
	processing: number;
	done: number;
	failed: number;
}

export interface TriggerScoringResponse {
	triggered: number;
	jobs: Array<{
		participantId: string;
		status: string;
	}>;
}

export interface OverrideScoreInput {
	finalScore: number;
	feedback?: string;
}

// API functions
export const scoringApi = {
	// Get list of exams (for teacher)
	async getExams(params?: {
		status?: string;
		search?: string;
		page?: number;
		limit?: number;
	}) {
		const response = await api.get<{
			success: boolean;
			data: ExamListItem[];
			pagination?: { total: number };
		}>("/exams", { params });
		return {
			exams: response.data.data || [],
			total: response.data.pagination?.total || 0,
		};
	},

	// Get exam scores with participants
	async getExamScores(examId: string) {
		const response = await api.get<{
			success: boolean;
			data: ExamScoresResponse;
		}>(`/scoring/exams/${examId}`);
		return response.data.data;
	},

	// Get participant answers with scores
	async getParticipantAnswers(examId: string, participantId: string) {
		const response = await api.get<{
			success: boolean;
			data: ParticipantAnswersResponse;
		}>(`/scoring/exams/${examId}/participants/${participantId}`);
		return response.data.data;
	},

	// Trigger AI scoring
	async triggerScoring(examId: string, participantIds?: string[]) {
		const response = await api.post<{
			success: boolean;
			data: TriggerScoringResponse;
		}>(`/scoring/exams/${examId}/trigger`, { participantIds });
		return response.data.data;
	},

	// Get scoring status
	async getScoringStatus(examId: string) {
		const response = await api.get<{
			success: boolean;
			data: ScoringStatusResponse;
		}>(`/scoring/exams/${examId}/status`);
		return response.data.data;
	},

	// Override score manually
	async overrideScore(answerId: string, input: OverrideScoreInput) {
		const response = await api.put<{
			success: boolean;
			data: AnswerDetail;
		}>(`/scoring/answers/${answerId}`, input);
		return response.data.data;
	},

	// Get exam details
	async getExamDetails(examId: string) {
		const response = await api.get<{
			success: boolean;
			data: ExamListItem;
		}>(`/exams/${examId}`);
		return response.data.data;
	},

	// Update exam status
	async updateExamStatus(
		examId: string,
		status: "DRAFT" | "ONGOING" | "FINISHED" | "PUBLISHED",
	) {
		const response = await api.patch<{
			success: boolean;
			data: ExamListItem;
		}>(`/exams/${examId}/status`, { status });
		return response.data.data;
	},

	// Update exam details
	async updateExam(
		examId: string,
		data: {
			title?: string;
			description?: string;
			startTime?: string | null;
			endTime?: string | null;
			duration?: number | null;
			settings?: Record<string, unknown>;
		},
	) {
		const response = await api.put<{
			success: boolean;
			data: ExamListItem;
		}>(`/exams/${examId}`, data);
		return response.data.data;
	},

	// Create exam from material
	async createExamFromMaterial(materialId: string) {
		const response = await api.post<{
			success: boolean;
			data: ExamListItem;
		}>(`/materials/${materialId}/create-exam`);
		return response.data.data;
	},

	// Get exam questions
	async getExamQuestions(examId: string) {
		const response = await api.get<{
			success: boolean;
			data: any;
		}>(`/exams/${examId}`);
		return response.data.data?.examQuestions || [];
	},

	// Update question
	async updateQuestion(
		questionId: string,
		data: {
			question?: string;
			type?: "PG" | "ESSAY";
			options?: Record<string, string>;
			answerKey?: string;
			rubric?: Record<string, number>;
			difficulty?: string;
			category?: string;
		},
	) {
		const response = await api.put<{
			success: boolean;
			data: any;
		}>(`/questions/${questionId}`, data);
		return response.data.data;
	},
};

// Helper to parse feedback JSON
export function parseFeedback(feedbackJson: string | null): AIFeedback | null {
	if (!feedbackJson) return null;
	try {
		return JSON.parse(feedbackJson);
	} catch {
		return null;
	}
}
