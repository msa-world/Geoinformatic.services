import HeaderNavigation from "@/components/sections/header-navigation";
import HeroVideo from "@/components/sections/hero-video";
import WelcomeIntro from "@/components/sections/welcome-intro";
import ServicesGrid from "@/components/sections/services-grid";
import ProfessionalApproach from "@/components/sections/professional-approach";
import TestimonialsCarousel from "@/components/sections/testimonials-carousel";
import CtaHelpSection from "@/components/sections/cta-help";
import Footer from "@/components/sections/footer";
import JobsCTA from "@/components/sections/jobs-cta";
import ScrollTriggerRefresher from '@/components/ScrollTriggerRefresher';

export default function HomePage() {
  return (
    <>
      <ScrollTriggerRefresher />
      <div className="min-h-screen w-full">
        <HeaderNavigation />
        <main className="w-full">
          <HeroVideo />
          <WelcomeIntro />
          <ServicesGrid />
          <JobsCTA />
          <ProfessionalApproach />
          <TestimonialsCarousel />
          <CtaHelpSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
