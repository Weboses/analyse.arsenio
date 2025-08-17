import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface DatenschutzProps {
  onBack: () => void;
}

export default function Datenschutz({ onBack }: DatenschutzProps) {
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-purple-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-sm sm:text-base">Zurück</span>
            </button>
            <a 
              href="https://arsenio.at/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lg sm:text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors duration-300"
            >
              arsenio.at
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Datenschutzerklärung</h1>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Allgemeine Hinweise</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
                wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert 
                werden können.
              </p>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Datenerfassung auf dieser Website</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie 
                dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
              </p>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                <strong>Wie erfassen wir Ihre Daten?</strong><br />
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten 
                handeln, die Sie in unser Kontaktformular eingeben (Website-URL, E-Mail-Adresse).
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">2. Hosting</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Wir hosten die Inhalte unserer Website bei folgenden Anbietern:
              </p>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Supabase</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Wir nutzen Supabase für die Datenspeicherung und Backend-Services. Anbieter ist Supabase Inc., 
                970 Toa Payoh North #07-04, Singapore 318992.
              </p>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Details entnehmen Sie der Datenschutzerklärung von Supabase: 
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline ml-1">
                  https://supabase.com/privacy
                </a>
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Datenschutz</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie 
                dieser Datenschutzerklärung.
              </p>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
                <strong>Bojan Arsenić</strong><br />
                Bahnhofstraße 7, A-6800 Feldkirch<br />
                UID-Nr: ATU82232013<br />
                Telefon: +436601503210<br />
                E-Mail: <a href="mailto:office@arsenio.at" className="text-purple-600 hover:underline">office@arsenio.at</a>
              </p>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Speicherdauer</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
                Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Kontaktformular</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular 
                inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall 
                von Anschlussfragen bei uns gespeichert.
              </p>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                <strong>Welche Daten erfassen wir?</strong>
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 space-y-1">
                <li>Website-URL Ihres Unternehmens</li>
                <li>E-Mail-Adresse</li>
                <li>Zeitpunkt der Anfrage</li>
                <li>IP-Adresse (automatisch erfasst)</li>
              </ul>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                <strong>Wofür nutzen wir Ihre Daten?</strong>
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 space-y-1">
                <li>Durchführung der kostenlosen Website-Analyse</li>
                <li>Zusendung der Analyse-Ergebnisse per E-Mail</li>
                <li>Kontaktaufnahme bei Rückfragen</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Automatisierte Website-Analyse</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Ihre angegebene Website-URL wird durch unsere KI-gestützten Tools automatisch analysiert. Dabei werden 
                öffentlich zugängliche Informationen Ihrer Website ausgewertet (Design, Ladezeiten, SEO-Faktoren, etc.). 
                Es werden keine privaten oder geschützten Bereiche Ihrer Website aufgerufen.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">5. Ihre Rechte</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Sie haben jederzeit das Recht:
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 space-y-1">
                <li>unentgeltlich Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten</li>
                <li>die Berichtigung unrichtiger Daten zu verlangen</li>
                <li>die Löschung Ihrer bei uns gespeicherten Daten zu verlangen</li>
                <li>die Einschränkung der Datenverarbeitung zu verlangen</li>
                <li>Widerspruch gegen die Verarbeitung Ihrer Daten einzulegen</li>
                <li>Ihre Daten in einem strukturierten Format zu erhalten (Datenportabilität)</li>
              </ul>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: 
                <a href="mailto:office@arsenio.at" className="text-purple-600 hover:underline ml-1">office@arsenio.at</a>
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">6. Widerruf Ihrer Einwilligung zur Datenverarbeitung</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine 
                bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten 
                Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">7. Beschwerderecht bei der zuständigen Aufsichtsbehörde</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer 
                Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes 
                oder des Orts des mutmaßlichen Verstoßes zu.
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 sm:p-6 mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Besondere Hinweise zu unserem Service</h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                <strong>Kostenlose Website-Analyse:</strong> Unser Service ist vollständig kostenlos. Wir verwenden Ihre 
                Daten ausschließlich zur Bereitstellung der Analyse-Ergebnisse. Eine Weitergabe an Dritte erfolgt nicht. 
                Die Analyse erfolgt automatisiert und die Ergebnisse werden Ihnen per E-Mail zugesendet.
              </p>
            </div>

            <div className="text-center mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-500">
                Stand dieser Datenschutzerklärung: Januar 2025
              </p>
            </div>
          </div>
        </div>
      </div>

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
                onClick={onBack}
                className="hover:text-pink-400 transition-colors"
              >
                Zurück zur Hauptseite
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