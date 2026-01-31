"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";

const performanceData = [
	{ name: "Exam 1", actual: 75, target: 80 },
	{ name: "Exam 2", actual: 82, target: 80 },
	{ name: "Exam 3", actual: 78, target: 82 },
	{ name: "Exam 4", actual: 88, target: 85 },
	{ name: "Exam 5", actual: 90, target: 85 },
];

const violationData = [
	{ name: "Head/Eye", count: 12 },
	{ name: "Mult. Face", count: 5 },
	{ name: "Obj Det.", count: 3 },
	{ name: "Voice", count: 8 },
];

export default function AnalyticsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					Classroom Analytics
				</h2>
				<p className="text-muted-foreground">
					Deep insights into student performance and integrity.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Class Performance Trend</CardTitle>
						<CardDescription>
							Average scores over the last 5 exams.
						</CardDescription>
					</CardHeader>
					<CardContent className="pl-2">
						<div className="h-[300px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={performanceData}>
									<defs>
										<linearGradient
											id="colorActual"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#059669"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="#059669"
												stopOpacity={0}
											/>
										</linearGradient>
									</defs>
									<XAxis
										dataKey="name"
										stroke="#888888"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										stroke="#888888"
										fontSize={12}
										tickLine={false}
										axisLine={false}
										tickFormatter={(value) => `${value}`}
									/>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
									/>
									<Tooltip />
									<Area
										type="monotone"
										dataKey="actual"
										stroke="#059669"
										fillOpacity={1}
										fill="url(#colorActual)"
									/>
									<Area
										type="monotone"
										dataKey="target"
										stroke="#2563EB"
										strokeDasharray="5 5"
										fill="none"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Violation Distribution</CardTitle>
						<CardDescription>
							Most common alerts during proctoring.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[300px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={violationData}>
									<XAxis
										dataKey="name"
										stroke="#888888"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										stroke="#888888"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip cursor={{ fill: "transparent" }} />
									<Bar
										dataKey="count"
										fill="#EF4444"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
