import type { Metadata } from "next";
import { Raleway, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const raleway = Raleway({
	subsets: ["latin"],
	variable: "--font-raleway",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
});

export const metadata: Metadata = {
	title: "SahabatGuru - Platform AI untuk Guru",
	description:
		"Asisten AI untuk guru: RPP, Ujian, Koreksi Otomatis, dan Proctoring.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${raleway.variable} ${dmSans.variable} font-sans antialiased`}
			>
				{children}
				<Toaster />
			</body>
		</html>
	);
}
