import React, { useState } from 'react';
import { CheckCircle, Phone, Mail, User, Building2, Shield, Clock, Target } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { LeadInsert } from './lib/supabase';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';

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

type CurrentView = 'main' | 'impressum' | 'datenschutz';

function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('main');

  const navigateToView = (view: CurrentView) => {
    setCurrentView(view);
  };

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    websiteUrl: '',
    email: '',
    consent: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  if (currentView === 'impressum') {
    return <Impressum onBack={() => navigateToView('main')} />;
  }

  if (currentView === 'datenschutz') {
    return <Datenschutz onBack={() => navigateToView('main')} />;
  }

  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Vorname muss mindestens 2 Zeichen lang sein';
    }

    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website-URL ist erforderlich';
    } else {
      if (!validateUrl(formData.websiteUrl)) {
        newErrors.websiteUrl = 'Bitte geben Sie eine gültige Website-URL ein (z.B. ihr-studio.de oder https://ihr-studio.de)';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail-Adresse ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }

    if (!formData.consent) {
      newErrors.consent = 'Sie müssen der Datenschutzerklärung zustimmen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to normalize URL before saving
  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();
    
    // Add https:// if no protocol is specified (we'll test both in analysis)
    if (!/^https?:\/\//.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    
    return normalized;
  };

  // Enhanced URL validation that accepts both HTTP and HTTPS
  const validateUrl = (url: string): boolean => {
    const trimmed = url.trim();
    const hasProtocol = /^https?:\/\//.test(trimmed);
    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    
    // Check if it's a valid domain format
    const domainPattern = /^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(\/.*)?$/;
    return domainPattern.test(withoutProtocol);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      alert('⚠️ Konfigurationsfehler: Supabase-Verbindung nicht verfügbar.\n\nBitte kontaktieren Sie den Administrator.');
      return;
    }
    setIsSubmitting(true);

    try {
      console.log('Sending RPC call with data:', {
        first_name: formData.firstName.trim(),
        email: formData.email,
        website_url: normalizeUrl(formData.websiteUrl)
      });

      // RPC call with exactly 3 parameters
      const { data, error } = await supabase.rpc('notify_new_lead', {
        first_name: formData.firstName.trim(),
        email: formData.email,
        website_url: normalizeUrl(formData.websiteUrl)
      });

      if (error) {
        console.error('RPC error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
      }

      console.log('✅ Lead successfully created via RPC with ID:', data);
      
      // Send webhook via Edge Function
      try {
        const webhookResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-notify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: data,
            firstName: formData.firstName.trim(),
            email: formData.email,
            websiteUrl: normalizeUrl(formData.websiteUrl)
          })
        });

        if (webhookResponse.ok) {
          console.log('✅ Webhook sent to n8n successfully');
        } else {
          console.warn('⚠️ Webhook failed, but lead was created');
        }
      } catch (webhookError) {
        console.warn('⚠️ Webhook error, but lead was created:', webhookError);
      }
      
      // Conversion Tracking würde hier ausgelöst
      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', { 
          'send_to': import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID 
        });
      }
      
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead');
      }
      
      setShowThankYou(true);
    } catch (error) {
      console.error('❌ Error creating lead:', error);
      
      // Check for duplicate email error
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        setErrors({ email: 'Diese E-Mail-Adresse ist bereits registriert. Bitte verwenden Sie eine andere E-Mail-Adresse.' });
      } else {
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? error.message 
          : 'Unbekannter Fehler';
        alert(`Fehler: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Analyse gestartet!
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Ihre Website wird gerade von unserer KI analysiert. Sie erhalten die Ergebnisse in 3 Minuten per E-Mail.
              </p>
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6">
                <p className="text-gray-700">
                  <strong>Was passiert jetzt?</strong><br />
                  Unsere KI prüft Ihre Website auf über 50 Faktoren und erstellt einen detaillierten Bericht mit konkreten Verbesserungsvorschlägen.
                </p>
              </div>
              <div className="mt-8">
                <a
                  href="https://arsenio.at/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Zur arsenio.at Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-center">
            <a 
              href="https://arsenio.at/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors duration-300"
            >
              arsenio.at
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Kostenlose<br />
              Website-Analyse<br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                für Ihr Kosmetikstudio
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Erfahren Sie in 3 Minuten, was Ihre Website davon abhält, mehr Kundinnen zu gewinnen. Unsere KI analysiert Ihre Seite und zeigt konkrete Verbesserungen auf.
            </p>

            <button
              onClick={scrollToForm}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg sm:text-xl font-semibold px-8 sm:px-10 py-3 sm:py-4 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 w-full sm:w-auto"
            >
              Jetzt kostenlose Analyse starten!
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8 pt-6 sm:pt-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">500+</div>
                <div className="text-xs sm:text-sm text-gray-600">Websites analysiert</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">73%</div>
                <div className="text-xs sm:text-sm text-gray-600">Verbesserungspotential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">3 Min</div>
                <div className="text-xs sm:text-sm text-gray-600">Bis zum Ergebnis</div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 rounded-full p-1">
              <img 
                src="https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Professionelle Kosmetikbehandlung im Studio"
                className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Perfekt für Ihr Kosmetikstudio
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Unsere KI-Analyse ist speziell für Beauty- und Wellness-Unternehmen entwickelt und berücksichtigt die besonderen Anforderungen Ihrer Branche.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center relative">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Formular ausfüllen</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Geben Sie Ihre Website-URL und Kontaktdaten ein. Dauert nur 30 Sekunden.
              </p>
              <div className="hidden lg:block absolute top-8 sm:top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600"></div>
            </div>
            
            <div className="text-center relative sm:col-span-2 lg:col-span-1">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">KI-Analyse läuft</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Unsere KI prüft über 50 Faktoren: Design, Benutzerfreundlichkeit, SEO, Ladezeiten und Conversion-Optimierung. Dauert ca. 3 Minuten.
              </p>
              <div className="hidden lg:block absolute top-8 sm:top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600"></div>
            </div>
            
            <div className="text-center sm:col-start-2 lg:col-start-3">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Ergebnisse erhalten</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Sie erhalten einen detaillierten Bericht mit konkreten Handlungsempfehlungen per E-Mail in 3 Minuten.
              </p>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={scrollToForm}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-base sm:text-lg font-semibold px-6 sm:px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto max-w-sm mx-auto"
            >
              Jetzt starten - 100% kostenlos
            </button>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="lead-form" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Website-URL eingeben & Analyse starten
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 px-4">
                Geben Sie einfach Ihre Website-URL ein und erhalten Sie eine detaillierte Analyse mit konkreten Handlungsempfehlungen in nur 3 Minuten.
              </p>
              
              {/* Trust Badges - Side by Side */}
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                <div className="inline-flex items-center bg-green-50 text-green-800 px-3 sm:px-4 py-2 rounded-full border border-green-200">
                  <Shield className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm font-medium">100% anonym und sicher</span>
                </div>
                <div className="inline-flex items-center bg-red-50 text-red-800 px-3 sm:px-4 py-2 rounded-full border border-red-200">
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm font-medium">Nur für kurze Zeit kostenlos</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Ihr Vorname *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ihr Vorname"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Website-URL Ihres Studios *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        errors.websiteUrl ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://ihr-studio.de"
                    />
                  </div>
                  {errors.websiteUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    💡 z.B. "https://ihr-studio.de"
                  </p>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    E-Mail für Analyse-Ergebnisse *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="ihre@email.de"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Simplified Consent */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => handleInputChange('consent', e.target.checked)}
                      className="mt-0.5 sm:mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded flex-shrink-0"
                    />
                    <div className="text-xs sm:text-sm text-gray-700">
                      <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                        Ihre Daten werden ausschließlich für die Analyse verwendet
                      </div>
                      <div>
                        Ich stimme der Verarbeitung meiner Daten laut{' '}
                        <button 
                          type="button"
                          onClick={() => navigateToView('datenschutz')}
                          className="text-pink-600 hover:underline"
                        >
                          Datenschutzerklärung
                        </button>{' '}
                        zu. *
                      </div>
                    </div>
                  </label>
                  {errors.consent && (
                    <p className="mt-2 text-sm text-red-600">{errors.consent}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-base sm:text-lg font-semibold py-3 sm:py-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isSubmitting ? 'Analyse läuft...' : '🚀 Jetzt kostenlose Analyse starten!'}
                  </span>
                  {!isSubmitting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>

              {/* Simplified Bottom Info */}
              <div className="text-center text-xs sm:text-sm text-gray-600 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  <p>⚡ Analyse dauert nur 3 Minuten</p>
                  <p>📊 Über 50 Faktoren werden geprüft</p>
                  <p>📧 Ergebnisse per E-Mail</p>
                  <p>🔒 Keine Weitergabe an Dritte</p>
                </div>
              </div>
            </form>

            {/* Trust Elements - Simplified */}
            <div className="mt-8 sm:mt-12">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-lg">
                  <CheckCircle className="w-10 sm:w-12 h-10 sm:h-12 text-green-500 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">100% kostenlos</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Keine versteckten Kosten</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-lg sm:col-span-2 lg:col-span-1">
                  <Target className="w-10 sm:w-12 h-10 sm:h-12 text-purple-500 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">KI-gestützte Analyse</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Modernste Technologie</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-lg sm:col-start-2 lg:col-start-3">
                  <Clock className="w-10 sm:w-12 h-10 sm:h-12 text-pink-500 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Schnelle Ergebnisse</h3>
                  <p className="text-xs sm:text-sm text-gray-600">In nur 3 Minuten</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Das sagen unsere Kunden
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-400">⭐</div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-semibold text-gray-900">4.9/5</span>
                <span className="text-sm sm:text-base text-gray-600">(127 Google Bewertungen)</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400">⭐</div>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                "Die Analyse hat mir die Augen geöffnet! Ich wusste nicht, dass meine Website so viele Schwachstellen hatte. Nach den Verbesserungen habe ich 40% mehr Online-Termine."
              </p>
              <div className="flex items-center">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-white font-semibold text-sm sm:text-base">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Sarah M.</div>
                  <div className="text-xs sm:text-sm text-gray-600">Kosmetikstudio Wien</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400">⭐</div>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                "Professionell und schnell! Der Bericht war sehr detailliert und die Empfehlungen waren sofort umsetzbar. Meine Website lädt jetzt viel schneller."
              </p>
              <div className="flex items-center">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-white font-semibold text-sm sm:text-base">JK</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Julia K.</div>
                  <div className="text-xs sm:text-sm text-gray-600">Laserhaarentfernung Graz</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg sm:col-start-2 lg:col-start-3">
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400">⭐</div>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                "Endlich verstehe ich, warum meine Website nicht konvertiert hat. Die Analyse war kostenlos, aber der Wert unbezahlbar. Sehr empfehlenswert!"
              </p>
              <div className="flex items-center">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-white font-semibold text-sm sm:text-base">MH</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Maria H.</div>
                  <div className="text-xs sm:text-sm text-gray-600">Wellness Center Salzburg</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">Vertrauen Sie auf die Erfahrung von über 500 zufriedenen Kunden</p>
            <button
              onClick={scrollToForm}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-base sm:text-lg font-semibold px-6 sm:px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto max-w-sm mx-auto"
            >
              Auch Sie können profitieren - Jetzt starten
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <a 
              href="https://arsenio.at/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lg sm:text-xl font-bold hover:text-pink-400 transition-colors duration-300"
            >
              arsenio.at
            </a>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-center">
              <button 
                onClick={() => navigateToView('impressum')}
                className="hover:text-pink-400 transition-colors"
              >
                Impressum
              </button>
              <button 
                onClick={() => navigateToView('datenschutz')}
                className="hover:text-pink-400 transition-colors"
              >
                Datenschutzerklärung
              </button>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-400">
            <p className="px-4">&copy; 2025 arsenio.at - Kostenlose Website-Analysen für Beauty & Wellness Studios</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;