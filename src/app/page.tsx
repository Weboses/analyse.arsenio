"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle,
  Mail,
  User,
  Globe,
  Shield,
  Clock,
  Loader2,
  Zap,
  Search,
  BarChart3,
  Smartphone,
  Lock,
  Star,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";

interface FormData {
  firstName: string;
  websiteUrl: string;
  email: string;
  consent: boolean;
}

interface FormErrors {
  firstName?: string;
  websiteUrl?: string;
  email?: string;
  consent?: string;
}

interface ProgressStatus {
  leadId: string;
  status: string;
  step: number;
  totalSteps: number;
  label: string;
  isCompleted: boolean;
  isFailed: boolean;
  scores?: {
    performanceMobile: number;
    performanceDesktop: number;
    seo: number;
    accessibility: number;
    security: number;
  };
}

const progressSteps = [
  { id: "queued", label: "In Warteschlange", icon: Clock },
  { id: "analyzing_performance", label: "Performance analysieren", icon: Zap },
  { id: "analyzing_seo", label: "SEO & Sicherheit prüfen", icon: Search },
  { id: "checking_links", label: "Links überprüfen", icon: Globe },
  { id: "generating_report", label: "KI-Bericht erstellen", icon: Sparkles },
  { id: "saving_results", label: "Ergebnisse speichern", icon: BarChart3 },
  { id: "sending_email", label: "E-Mail senden", icon: Mail },
  { id: "completed", label: "Fertig!", icon: CheckCircle },
];

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    websiteUrl: "",
    email: "",
    consent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStatus, setProgressStatus] = useState<ProgressStatus | null>(null);
  const [currentView, setCurrentView] = useState<"main" | "impressum" | "datenschutz">("main");

  const pollStatus = useCallback(async (leadId: string) => {
    try {
      const response = await fetch(`/api/analyze/${leadId}/status`);
      const data = await response.json();
      setProgressStatus(data);
      if (!data.isCompleted && !data.isFailed) {
        setTimeout(() => pollStatus(leadId), 1500);
      }
    } catch (error) {
      console.error("Status poll error:", error);
      setTimeout(() => pollStatus(leadId), 3000);
    }
  }, []);

  const validateUrl = (url: string): boolean => {
    const trimmed = url.trim().toLowerCase();
    if (!trimmed) return false;
    // Remove protocol if present
    const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
    // Simple check: must have at least one dot and some characters
    // Accepts: example.com, www.example.com, sub.domain.co.at, etc.
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/.test(withoutProtocol);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      newErrors.firstName = "Bitte geben Sie Ihren Vornamen ein";
    }
    if (!formData.websiteUrl.trim() || !validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = "Bitte geben Sie eine gültige Website-URL ein";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein";
    }
    if (!formData.consent) {
      newErrors.consent = "Bitte stimmen Sie der Datenschutzerklärung zu";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/analyze/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          email: formData.email.toLowerCase().trim(),
          websiteUrl: formData.websiteUrl.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Ein Fehler ist aufgetreten");

      setShowProgress(true);
      setProgressStatus({
        leadId: data.leadId,
        status: "queued",
        step: 0,
        totalSteps: 7,
        label: "In Warteschlange...",
        isCompleted: false,
        isFailed: false,
      });

      fetch("/api/analyze/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: data.leadId }),
      }).catch(err => console.error("Process trigger error:", err));

      pollStatus(data.leadId);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Impressum
  if (currentView === "impressum") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <button onClick={() => setCurrentView("main")} className="mb-8 text-pink-600 hover:text-pink-700 flex items-center gap-2 font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" /> Zurück
          </button>
          <h1 className="text-3xl font-bold mb-8">Impressum</h1>
          <div className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
            <p><strong>arsenio.at</strong></p>
            <p>Bojan Arsenovic</p>
            <p>E-Mail: office@arsenio.at</p>
            <p>Telefon: +43 660 150 3210</p>
            <p className="pt-4">Unternehmensgegenstand: IT-Dienstleistungen, Webdesign, Online Marketing</p>
          </div>
        </div>
      </div>
    );
  }

  // Datenschutz
  if (currentView === "datenschutz") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <button onClick={() => setCurrentView("main")} className="mb-8 text-pink-600 hover:text-pink-700 flex items-center gap-2 font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" /> Zurück
          </button>
          <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
          <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
              <p>arsenio.at, Bojan Arsenovic, office@arsenio.at</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Erhobene Daten</h2>
              <p>Vorname, E-Mail-Adresse, Website-URL - ausschließlich für die Website-Analyse.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3">3. Speicherdauer</h2>
              <p>Maximal 12 Monate, sofern keine längere Aufbewahrungspflicht besteht.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Ihre Rechte</h2>
              <p>Auskunft, Berichtigung, Löschung - Kontakt: office@arsenio.at</p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Progress Page - kompakt
  if (showProgress && progressStatus) {
    const currentStepIndex = progressSteps.findIndex(s => s.id === progressStatus.status);
    const progress = progressStatus.isCompleted ? 100 : Math.round((currentStepIndex / (progressSteps.length - 1)) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Status Icon & Title */}
            <div className="text-center mb-6">
              {progressStatus.isCompleted ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              ) : progressStatus.isFailed ? (
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
              ) : (
                <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-3 animate-spin" />
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {progressStatus.isCompleted ? "Fertig!" : progressStatus.isFailed ? "Fehler" : progressStatus.label}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{formData.websiteUrl}</p>
            </div>

            {/* Progress Bar */}
            {!progressStatus.isFailed && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Fortschritt</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${progressStatus.isCompleted ? "bg-green-500" : "bg-gradient-to-r from-pink-500 to-purple-600"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scores when completed */}
            {progressStatus.isCompleted && progressStatus.scores && (
              <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-gray-50 rounded-xl">
                {[
                  { label: "Speed", value: progressStatus.scores.performanceMobile },
                  { label: "SEO", value: progressStatus.scores.seo },
                  { label: "A11y", value: progressStatus.scores.accessibility },
                  { label: "Sicher", value: progressStatus.scores.security || 0 },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`text-xl font-bold ${item.value >= 80 ? "text-green-600" : item.value >= 50 ? "text-yellow-600" : "text-red-600"}`}>{item.value}</div>
                    <div className="text-xs text-gray-400">{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Email info */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <Mail className="w-4 h-4" />
              <span>{progressStatus.isCompleted ? "Gesendet an" : "Wird gesendet an"} <strong className="text-gray-700">{formData.email}</strong></span>
            </div>

            {/* Actions */}
            {progressStatus.isCompleted ? (
              <a href="https://arsenio.at/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all">
                Mehr erfahren <ArrowRight className="w-4 h-4" />
              </a>
            ) : progressStatus.isFailed ? (
              <button onClick={() => { setShowProgress(false); setProgressStatus(null); }} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-lg">
                Erneut versuchen
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400">Sie können diese Seite schließen - der Bericht kommt per E-Mail.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Landing Page
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Header inside */}
      <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Header */}
        <header className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="https://arsenio.at/" target="_blank" rel="noopener noreferrer" className="text-lg font-bold">
            arsenio<span className="text-pink-400">.at</span>
          </a>
          <a href="https://arsenio.at/kontakt" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white font-medium px-4 py-2 rounded-full text-sm hover:bg-white/20 transition-colors">
            Kontakt
          </a>
        </header>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                KI-gestützte Website-Analyse
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Gewinnen Sie mehr
                <br />
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Kundinnen online
                </span>
              </h1>

              <p className="text-lg text-gray-300 mb-6 max-w-lg mx-auto lg:mx-0">
                Erfahren Sie in 3 Minuten, warum Ihre Website nicht genug Termine bringt.
              </p>

              {/* Kundenfragen */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 mb-8 max-w-lg mx-auto lg:mx-0">
                <p className="text-sm text-gray-400 mb-2">Die Analyse beantwortet:</p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> Ist meine Website zu langsam?</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> Werde ich bei Google gefunden?</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> Brauche ich eine neue Website?</li>
                </ul>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>100% kostenlos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>DSGVO-konform</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span>In 3 Minuten fertig</span>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div id="analyse" className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Kostenlose Website-Analyse starten
              </h2>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900 ${errors.firstName ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                      placeholder="Ihr Vorname"
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900 ${errors.websiteUrl ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                      placeholder="ihre-website.at"
                    />
                  </div>
                  {errors.websiteUrl && <p className="mt-1 text-xs text-red-500">{errors.websiteUrl}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900 ${errors.email ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                      placeholder="ihre@email.at"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => handleInputChange("consent", e.target.checked)}
                    className="mt-1 h-4 w-4 text-pink-500 rounded border-gray-300 focus:ring-pink-500"
                  />
                  <span className="text-xs text-gray-500">
                    Ich stimme der{" "}
                    <button type="button" onClick={() => setCurrentView("datenschutz")} className="text-pink-500 underline">
                      Datenschutzerklärung
                    </button>{" "}
                    zu.
                  </span>
                </label>
                {errors.consent && <p className="text-xs text-red-500">{errors.consent}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Wird gestartet...
                    </>
                  ) : (
                    <>
                      Jetzt kostenlos analysieren
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">
                Keine Kreditkarte erforderlich. Ergebnis per E-Mail in 3 Minuten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Eine einzige Info-Sektion */}
      <section className="py-10 md:py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* 3 Schritte horizontal */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
              {[
                { num: "1", text: "URL eingeben" },
                { num: "2", text: "KI analysiert" },
                { num: "3", text: "Report per E-Mail" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{item.num}</span>
                  <span className="text-gray-700 font-medium">{item.text}</span>
                  {i < 2 && <ArrowRight className="hidden md:block w-4 h-4 text-gray-300 ml-4" />}
                </div>
              ))}
            </div>

            {/* Tags + Stats in einer Zeile */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-pink-500" /> Performance</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1"><Search className="w-4 h-4 text-pink-500" /> SEO</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1"><Smartphone className="w-4 h-4 text-pink-500" /> Mobile</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1"><Lock className="w-4 h-4 text-pink-500" /> Sicherheit</span>
              <span className="hidden md:inline text-gray-300">|</span>
              <span className="font-semibold text-gray-700">500+ Analysen</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Logo & Info */}
            <div className="text-center md:text-left">
              <a href="https://arsenio.at/" target="_blank" rel="noopener noreferrer" className="inline-block text-2xl font-bold mb-3">
                arsenio<span className="text-pink-400">.at</span>
              </a>
              <p className="text-gray-400 text-sm">
                Professionelle Websites & Online-Marketing für Ihr Business.
              </p>
            </div>

            {/* Links */}
            <div className="text-center">
              <h4 className="font-semibold mb-4 text-white">Rechtliches</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setCurrentView("impressum")}
                  className="text-gray-400 hover:text-pink-400 transition-colors text-sm"
                >
                  Impressum
                </button>
                <button
                  onClick={() => setCurrentView("datenschutz")}
                  className="text-gray-400 hover:text-pink-400 transition-colors text-sm"
                >
                  Datenschutzerklärung
                </button>
              </div>
            </div>

            {/* Kontakt */}
            <div className="text-center md:text-right">
              <h4 className="font-semibold mb-4 text-white">Kontakt</h4>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href="https://arsenio.at/kontakt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  Kontaktformular
                </a>
                <a
                  href="mailto:office@arsenio.at"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  office@arsenio.at
                </a>
                <a
                  href="tel:+436601503210"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  +43 660 150 3210
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-10 pt-6 text-center">
            <p className="text-gray-500 text-xs">
              &copy; {new Date().getFullYear()} arsenio.at – Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
