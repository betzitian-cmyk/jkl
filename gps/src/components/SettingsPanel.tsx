import { Settings as SettingsIcon, Moon, Sun, ShieldAlert, RotateCcw, HelpCircle } from 'lucide-react';
import { Settings } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  setSettings: (val: Settings) => void;
  onResetStats: () => void;
  language?: 'fr' | 'en';
  onLanguageChange?: (lang: 'fr' | 'en') => void;
}

export default function SettingsPanel({ 
  settings, 
  setSettings, 
  onResetStats,
  language = 'fr',
  onLanguageChange 
}: SettingsPanelProps) {
  const isFr = (settings.language || language) === 'fr';

  const toggleLanguage = (lang: 'fr' | 'en') => {
    setSettings({
      ...settings,
      language: lang,
    });
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const toggleUnit = (unit: 'kmh' | 'mph') => {
    // If we transition to mph, scale down warning limit, or vice versa
    let nextWarning = settings.warningSpeed;
    if (unit === 'mph' && settings.units === 'kmh') {
      nextWarning = Math.round(settings.warningSpeed * 0.621371);
    } else if (unit === 'kmh' && settings.units === 'mph') {
      nextWarning = Math.round(settings.warningSpeed / 0.621371);
    }

    setSettings({
      ...settings,
      units: unit,
      warningSpeed: nextWarning,
    });
  };

  const setWarningLimit = (limit: number) => {
    setSettings({
      ...settings,
      warningSpeed: Math.max(10, Math.min(240, limit)),
    });
  };

  const toggleTheme = (theme: 'dark' | 'light') => {
    setSettings({
      ...settings,
      theme,
    });
  };

  return (
    <div id="settings-section" className={`flex flex-col gap-6 p-6 backdrop-blur-xl border rounded-[2rem] shadow-2xl transition-all duration-300 ${
      settings.theme === 'light'
        ? 'bg-white/80 border-zinc-200/80 shadow-zinc-200/40'
        : 'bg-zinc-900/40 border-white/10 shadow-black/40'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-sky-500/10 text-sky-600 border-sky-500/15'
            : 'bg-sky-500/10 text-sky-400 border-sky-500/15'
        }`}>
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col text-left">
          <h2 className={`font-sans text-xl font-bold tracking-tight ${
            settings.theme === 'light' ? 'text-zinc-900' : 'text-white'
          }`}>{isFr ? 'PRÉFÉRENCES' : 'PREFERENCES'}</h2>
          <p className={`text-xs ${
            settings.theme === 'light' ? 'text-zinc-500' : 'text-white/50'
          }`}>{isFr ? 'Personnalisez le compteur et les paramètres de sécurité' : 'Personalize speedometer and safety parameters'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Toggle Language Row */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-zinc-50/60 border-zinc-200/60'
            : 'bg-black/30 border-white/5'
        }`}>
          <div className="flex flex-col text-left">
            <span className={`text-sm font-semibold ${
              settings.theme === 'light' ? 'text-zinc-800' : 'text-white/90'
            }`}>{isFr ? 'Langue de l\'application' : 'Application Language'}</span>
            <span className={`text-[10px] font-mono mt-0.5 ${
              settings.theme === 'light' ? 'text-zinc-400' : 'text-white/40'
            }`}>{isFr ? 'Basculer entre français et anglais' : 'Switch between French and English'}</span>
          </div>
          <div className={`flex p-0.5 rounded-xl border ${
            settings.theme === 'light'
              ? 'bg-zinc-100 border-zinc-200/80'
              : 'bg-zinc-800/80 border-white/5'
          }`}>
            <button
              onClick={() => toggleLanguage('fr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isFr
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : settings.theme === 'light'
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-white/60 hover:text-white'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => toggleLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                !isFr
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : settings.theme === 'light'
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-white/60 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Toggle Theme Row */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-zinc-50/60 border-zinc-200/60'
            : 'bg-black/30 border-white/5'
        }`}>
          <div className="flex flex-col text-left">
            <span className={`text-sm font-semibold ${
              settings.theme === 'light' ? 'text-zinc-800' : 'text-white/90'
            }`}>{isFr ? 'Thème d\'affichage' : 'Appearance Theme'}</span>
            <span className={`text-[10px] font-mono mt-0.5 ${
              settings.theme === 'light' ? 'text-zinc-400' : 'text-white/40'
            }`}>{isFr ? 'Sélectionnez votre vue de conduite' : 'Select your driving canvas view'}</span>
          </div>
          <div className={`flex p-0.5 rounded-xl border ${
            settings.theme === 'light'
              ? 'bg-zinc-100 border-zinc-200/80'
              : 'bg-zinc-800/80 border-white/5'
          }`}>
            <button
              onClick={() => toggleTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : settings.theme === 'light'
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-white/60 hover:text-white'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>{isFr ? 'Sombre' : 'Dark'}</span>
            </button>
            <button
              onClick={() => toggleTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                settings.theme === 'light'
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>{isFr ? 'Clair' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Toggle Units Row */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-zinc-50/60 border-zinc-200/60'
            : 'bg-black/30 border-white/5'
        }`}>
          <div className="flex flex-col text-left">
            <span className={`text-sm font-semibold ${
              settings.theme === 'light' ? 'text-zinc-800' : 'text-white/90'
            }`}>{isFr ? 'Unités de vitesse' : 'Speed Tracking Units'}</span>
            <span className={`text-[10px] font-mono mt-0.5 ${
              settings.theme === 'light' ? 'text-zinc-400' : 'text-white/40'
            }`}>{isFr ? 'Basculer kilomètres ou miles' : 'Toggle kilometers or miles standard'}</span>
          </div>
          <div className={`flex p-0.5 rounded-xl border ${
            settings.theme === 'light'
              ? 'bg-zinc-100 border-zinc-200/80'
              : 'bg-zinc-800/80 border-white/5'
          }`}>
            <button
              onClick={() => toggleUnit('kmh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                settings.units === 'kmh'
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : settings.theme === 'light'
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-white/60 hover:text-white'
              }`}
            >
              KM/H
            </button>
            <button
              onClick={() => toggleUnit('mph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                settings.units === 'mph'
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : settings.theme === 'light'
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-white/60 hover:text-white'
              }`}
            >
              MPH
            </button>
          </div>
        </div>

        {/* Auto Start Trip Row */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-zinc-50/60 border-zinc-200/60'
            : 'bg-black/30 border-white/5'
        }`}>
          <div className="flex flex-col text-left">
            <span className={`text-sm font-semibold ${
              settings.theme === 'light' ? 'text-zinc-800' : 'text-white/90'
            }`}>{isFr ? 'Démarrage automatique des trajets' : 'Auto Start Trip Logging'}</span>
            <span className={`text-[10px] font-mono mt-0.5 ${
              settings.theme === 'light' ? 'text-zinc-400 font-medium' : 'text-white/40'
            }`}>
              {isFr 
                ? `Vitesse maintenue ${settings.units === 'kmh' ? '> 15 km/h' : '> 9,3 mph'} pendant 10s démarre le trajet` 
                : `Sustained speed ${settings.units === 'kmh' ? '> 15 km/h' : '> 9.3 mph'} for 10s automatically starts trip`}
            </span>
          </div>
          <button
            onClick={() => setSettings({ ...settings, autoStartTrip: !settings.autoStartTrip })}
            className={`relative inline-flex h-6.5 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
              settings.autoStartTrip ? 'bg-sky-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                settings.autoStartTrip ? 'translate-x-5.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Overspeed limit slider */}
        <div className={`flex flex-col gap-3 p-4 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-zinc-50/60 border-zinc-200/60'
            : 'bg-black/30 border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className={`text-sm font-semibold ${
                settings.theme === 'light' ? 'text-zinc-800' : 'text-white/90'
              }`}>{isFr ? 'Seuil d\'alerte de vitesse' : 'Overspeed Limit Threshold'}</span>
              <span className={`text-[10px] font-mono mt-0.5 ${
                settings.theme === 'light' ? 'text-zinc-400' : 'text-white/40'
              }`}>{isFr ? 'Déclenche alertes sonores et visuelles' : 'Triggers auditory warnings and flashes'}</span>
            </div>
            <div className={`px-3 py-1 rounded-xl border flex items-baseline gap-0.5 ${
              settings.theme === 'light'
                ? 'bg-sky-500/10 border-sky-500/20 text-sky-600'
                : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
            }`}>
              <span className="text-sm font-bold font-sans">{settings.warningSpeed}</span>
              <span className={`text-[9px] font-mono uppercase ${
                settings.theme === 'light' ? 'text-sky-600/60' : 'text-sky-400/50'
              }`}>
                {settings.units === 'kmh' ? 'km/h' : 'mph'}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="30"
            max={settings.units === 'kmh' ? '180' : '110'}
            value={settings.warningSpeed}
            onChange={(e) => setWarningLimit(Number(e.target.value))}
            className="w-full accent-sky-500 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className={`flex items-center gap-1.5 text-[10px] font-mono ${
            settings.theme === 'light' ? 'text-zinc-500' : 'text-white/40'
          }`}>
            <ShieldAlert className={`h-3 w-3 ${settings.theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`} />
            <span>{isFr ? 'Alertes de sécurité routière actives au-dessus de cette vitesse.' : 'Automobile active safety warnings will play above this speed.'}</span>
          </div>
        </div>

        {/* Reset / Erase Card */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          settings.theme === 'light'
            ? 'bg-red-500/5 border-red-500/15'
            : 'bg-red-500/5 border-red-500/10'
        }`}>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-red-500 dark:text-red-400">{isFr ? 'Réinitialiser les données' : 'Erase Statistics'}</span>
            <span className={`text-[10px] font-mono mt-0.5 ${
              settings.theme === 'light' ? 'text-red-400/60' : 'text-red-400/50'
            }`}>{isFr ? 'Effacer tous les trajets enregistrés' : 'Clear all registered trip histories'}</span>
          </div>
          <button
            onClick={onResetStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isFr ? 'Effacer' : 'Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
