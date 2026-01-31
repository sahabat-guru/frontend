import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { AnalyticsPreview } from "@/components/landing/AnalyticsPreview";
import { CTA, Footer } from "@/components/landing/CTAFooter";

export default function Home() {
	return (
		<main className="min-h-screen bg-white">
			<LandingNavbar />
			<Hero />
			<Features />
			<AnalyticsPreview />
			<CTA />
			<Footer />
		</main>
	);
}
