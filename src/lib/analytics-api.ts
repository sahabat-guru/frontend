import { api } from "./api";

// Analytics API Types
export interface AnalyticsSummary {
	totalExams: number;
	totalMaterials: number;
	totalQuestions: number;
	totalStudents: number;
	avgOverallScore: number;
}

export interface RecentExam {
	id: string;
	title: string;
	status: string;
	createdAt: string;
	avgScore: number;
	participantCount: number;
}

export interface OverviewAnalytics {
	summary: AnalyticsSummary;
	examsByStatus: Record<string, number>;
	materialsByType: Record<string, number>;
	recentExams: RecentExam[];
}

export interface ExamStatistics {
	avgScore: number;
	maxScore: number;
	minScore: number;
	totalParticipants: number;
	submittedCount: number;
	scoredCount: number;
	completionRate: number;
	avgCompletionTime: number;
}

export interface ExamAnalytics {
	exam: {
		id: string;
		title: string;
		status: string;
		startTime: string | null;
		endTime: string | null;
	};
	statistics: ExamStatistics;
	scoreDistribution: Record<string, number>;
	proctoringViolations: Array<{
		eventType: string;
		count: number;
	}>;
	suspiciousCount: number;
}

export interface ExamHistoryItem {
	examId: string;
	examTitle: string;
	score: number | null;
	startTime: string | null;
	submitTime: string | null;
	status: string;
}

export interface StudentAnalytics {
	totalExams: number;
	completedExams: number;
	avgScore: number;
	highestScore: number;
	lowestScore: number;
	totalViolations: number;
	examHistory: ExamHistoryItem[];
}

// API Functions
export const analyticsApi = {
	// Get teacher overview analytics
	async getOverview(params?: {
		startDate?: string;
		endDate?: string;
	}): Promise<OverviewAnalytics> {
		const response = await api.get<{
			success: boolean;
			data: OverviewAnalytics;
		}>("/analytics/overview", { params });
		return response.data.data;
	},

	// Get detailed exam analytics
	async getExamAnalytics(examId: string): Promise<ExamAnalytics> {
		const response = await api.get<{
			success: boolean;
			data: ExamAnalytics;
		}>(`/analytics/exams/${examId}`);
		return response.data.data;
	},

	// Get student analytics
	async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
		const response = await api.get<{
			success: boolean;
			data: StudentAnalytics;
		}>(`/analytics/students/${studentId}`);
		return response.data.data;
	},
};
