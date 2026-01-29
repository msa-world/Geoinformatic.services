"use client";

import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    privacy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          privacy: false,
        });
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col pt-[80px]">
      <HeaderNavigation />
      <main className="flex-grow flex flex-col lg:flex-row">

        {/* Left Column: Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 xl:p-24 bg-white flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 mt-8 lg:mt-0">
              Contact us
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              Our friendly team would love to hear from you.
            </p>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                Thank you for contacting us! We'll get back to you soon.
              </div>
            )}
            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                Something went wrong. Please try again later or email us directly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-text-primary mb-2">
                    First name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-text-primary mb-2">
                    Last name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-text-primary mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">PK +92</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-16 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                    placeholder="300 0000000"
                  />
                </div>
              </div>

              {/* Preserving Subject field as per 'current information' requirement */}
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-text-primary mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-700"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="gis-consulting">GIS Consulting</option>
                  <option value="cadastral">Cadastral Mapping</option>
                  <option value="spatial-data">Spatial Data Services</option>
                  <option value="quote">Request a Quote</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-text-primary mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 placeholder:text-gray-400 resize-none"
                  placeholder="Leave us a message..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privacy"
                  name="privacy"
                  checked={formData.privacy}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="privacy" className="text-sm text-text-secondary">
                  You agree to our friendly <a href="#" className="underline hover:text-primary">privacy policy</a>.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.privacy}
                className="w-full bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="w-full lg:w-1/2 min-h-[500px] lg:min-h-screen bg-gray-100 relative order-first lg:order-last">
          <iframe
            src="https://maps.google.com/maps?q=33.653333,73.082778&t=&z=15&ie=UTF8&iwloc=&output=embed"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full grayscale-[20%]"
          />
        </div>
      </main>

      {/* Info Strip (Preserving Information) */}
      <section className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-text-primary mb-1">Visit Us</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                2nd Floor, National Business Center,<br />Murree Road, Rawalpindi
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-text-primary mb-1">Email Us</h3>
              <a href="mailto:GEOINFORMATIC.SERVICES@GMAIL.COM" className="text-sm text-text-secondary hover:text-primary">GEOINFORMATIC.SERVICES@GMAIL.COM</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-text-primary mb-1">Call Us</h3>
              <a href="tel:+923335400811" className="text-sm text-text-secondary hover:text-primary">+92 313-5561075</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-text-primary mb-1">Opening Hours</h3>
              <p className="text-sm text-text-secondary">Mon-Fri: 9am - 6pm</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
