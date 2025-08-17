import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ImpressumProps {
  onBack: () => void;
}

export default function Impressum({ onBack }: ImpressumProps) {
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Impressum</h1>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Angaben gemäß § 5 TMG</h2>
            
            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Diensteanbieter</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                <strong>Bojan Arsenić</strong><br />
                Bahnhofstraße 7, A-6800 Feldkirch<br />
                UID-Nr: ATU82232013<br />
                Gewerbeaufsichtsbehörde: Bezirkshauptmannschaft Feldkirch<br />
                Mitgliedschaften: bei der WKO, WK Vorarlberg Fachgruppe Werbung und Marktkommunikation<br />
                Telefon: +436601503210<br />
                E-Mail: <a href="mailto:office@arsenio.at" className="text-purple-600 hover:underline">office@arsenio.at</a><br />
                Website: <a href="https://arsenio.at" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">https://arsenio.at</a>
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Kontaktmöglichkeiten</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                <strong>Telefon:</strong> +436601503210<br />
                <strong>E-Mail-Adresse:</strong> <a href="mailto:office@arsenio.at" className="text-purple-600 hover:underline">office@arsenio.at</a><br />
                <strong>Anschrift:</strong> Bahnhofstraße 7, A-6800 Feldkirch<br />
                <strong>Kontaktformular:</strong> Verfügbar auf der Hauptwebsite
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Journalistische Inhalte</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                <strong>Verantwortlich nach § 18 Abs. 2 MStV:</strong><br />
                Bojan Arsenić<br />
                Bahnhofstraße 7, A-6800 Feldkirch
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Haftungs- und Urheberrechtshinweise</h3>
              
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-4 sm:mt-6">Haftung für Inhalte</h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>

              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-4 sm:mt-6">Haftung für Links</h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>

              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-4 sm:mt-6">Urheberrecht</h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Besondere Nutzungsbedingungen</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Soweit besondere Bedingungen für einzelne Nutzungen dieser Website von den vorgenannten Paragraphen abweichen, wird an entsprechender Stelle ausdrücklich darauf hingewiesen. In diesem Falle gelten im jeweiligen Einzelfall die besonderen Nutzungsbedingungen.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Online Streitbeilegung</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Verbraucher, welche in Österreich oder in einem sonstigen Vertragsstaat der ODR-VO niedergelassen sind, haben die 
                Möglichkeit Probleme bezüglich dem entgeltlichen Kauf von Waren oder Dienstleistungen im Rahmen einer Online-Streitbeilegung 
                (nach OS, AStG) zu lösen. Die Europäische Kommission stellt eine Plattform hierfür bereit: 
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm text-gray-600">
                <strong>Hinweis:</strong> Diese Website bietet kostenlose Website-Analysen für Kosmetikstudios und Beauty-Unternehmen. 
                Die Analyse erfolgt automatisiert durch KI-gestützte Tools. Alle erhobenen Daten werden ausschließlich für die 
                Bereitstellung der Analyse-Ergebnisse verwendet.
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