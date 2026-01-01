import { Check } from 'lucide-react';
import Link from 'next/link';

interface ServiceContentProps {
  sections: {
    title: string;
    content: string[];
  }[];
  features?: string[];
}

export default function ServiceContent({ sections, features }: ServiceContentProps) {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        {sections.map((section, index) => (
          <div key={index} className={index > 0 ? 'mt-16' : ''}>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-lg text-text-secondary leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}

        {features && features.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-[#D9A561] to-[#7FA89A] rounded-xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-white/95 text-lg mb-8 max-w-2xl mx-auto">
            Let our team of experts help you with your GIS project. Contact us today for a consultation.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-primary font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all hover:scale-105"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
