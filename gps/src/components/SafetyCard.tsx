import { useState, useEffect } from 'react';
import { ShieldCheck, Eye, Compass, HeartPulse, Sparkles, AlertTriangle } from 'lucide-react';

interface SafetyCardProps {
  speed: number | null; // in km/h
  warningSpeed: number; // in current units
  units: 'kmh' | 'mph';
  theme: 'dark' | 'light';
  language?: 'fr' | 'en';
}

const STATIC_SAFETY_TIPS_FR = [
  { icon: Eye, text: 'Maintenez une distance sécuritaire de 3 secondes avec le véhicule qui vous précède.' },
  { icon: ShieldCheck, text: 'Gardez les deux mains sur le volant aux positions 9h et 15h.' },
  { icon: Compass, text: 'Restez concentré sur la route. Évitez de regarder votre téléphone en conduisant.' },
  { icon: HeartPulse, text: 'Faites des pauses lors des longs trajets. Reposez-vous toutes les 2 heures.' },
  { icon: Sparkles, text: 'Évitez les changements de voie brusques et les freinages soudains pour maintenir un score élevé.' },
];

const STATIC_SAFETY_TIPS_EN = [
  { icon: Eye, text: 'Maintain a safe 3-second following distance from the vehicle ahead.' },
  { icon: ShieldCheck, text: 'Keep both hands on the steering wheel at the 9 and 3 o\'clock positions.' },
  { icon: Compass, text: 'Stay focused on the road. Avoid looking at mobile devices while driving.' },
  { icon: HeartPulse, text: 'Take a breaks on long trips. Rest every 2 hours or 100 miles of driving.' },
  { icon: Sparkles, text: 'Avoid sudden lane changes or rapid braking to maintain a high safety score.' },
];

export default function SafetyCard({ speed, warningSpeed, units, theme, language = 'fr' }: SafetyCardProps) {
  const isFr = language === 'fr';
  const staticTips = isFr ? STATIC_SAFETY_TIPS_FR : STATIC_SAFETY_TIPS_EN;
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Convert warning speed to km/h if unit is mph for comparison
  const warningSpeedKmh = units === 'mph' ? warningSpeed / 0.621371 : warningSpeed;
  const currentSpeed = speed || 0;
  const ratio = currentSpeed / warningSpeedKmh;

  // Rotate static tips every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % staticTips.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [staticTips.length]);

  // Determine active tip based on speed severity
  let speedAlertState: 'safe' | 'moderate' | 'high' | 'overspeed' = 'safe';
  let dynamicTip = '';
  let tipIconColor = 'text-emerald-500 dark:text-emerald-400';
  let bannerBg = '';

  if (ratio > 1.0) {
    speedAlertState = 'overspeed';
    dynamicTip = isFr 
      ? `Alerte excès de vitesse ! Vous dépassez la limite de sécurité de ${warningSpeed} ${units === 'kmh' ? 'km/h' : 'mph'}. Réduisez votre vitesse immédiatement.`
      : `Overspeed warning! You have exceeded the ${warningSpeed}${units === 'kmh' ? ' km/h' : ' mph'} safety limit. Reduce speed immediately.`;
    tipIconColor = 'text-red-500 animate-pulse';
    bannerBg = 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20 dark:border-red-500/40 animate-pulse';
  } else if (ratio > 0.9) {
    speedAlertState = 'high';
    dynamicTip = isFr
      ? "Vitesse élevée. Préparez-vous à relâcher l'accélérateur pour respecter la sécurité."
      : 'Nearing speed limit. Prepare to ease off the accelerator to maintain safety compliance.';
    tipIconColor = 'text-orange-500 dark:text-orange-400';
    bannerBg = 'bg-orange-500/5 border-orange-500/20 dark:bg-orange-500/10 dark:border-orange-500/20';
  } else if (ratio > 0.7) {
    speedAlertState = 'moderate';
    dynamicTip = isFr
      ? 'Vitesse modérée. Conduisez avec souplesse et anticipez le trafic pour éviter les freinages brusques.'
      : 'Moderate speed. Drive smoothly and anticipate traffic flows to prevent sudden stops.';
    tipIconColor = 'text-yellow-500 dark:text-yellow-400';
    bannerBg = 'bg-yellow-500/5 border-yellow-500/20 dark:bg-yellow-500/10 dark:border-yellow-500/20';
  } else {
    // Show normal rotating tip
    const activeTip = staticTips[currentTipIndex] || staticTips[0];
    dynamicTip = activeTip.text;
    tipIconColor = theme === 'light' ? 'text-sky-600' : 'text-sky-400';
    bannerBg = theme === 'light' 
      ? 'bg-white/80 border-zinc-200/80 shadow-sm shadow-zinc-200/40' 
      : 'bg-zinc-900/40 border-white/10';
  }

  const ActiveIcon = speedAlertState === 'overspeed' 
    ? AlertTriangle 
    : speedAlertState === 'high' 
      ? AlertTriangle 
      : (staticTips[currentTipIndex]?.icon || ShieldCheck);

  const tipIconBg = theme === 'light' 
    ? 'bg-zinc-100 border-zinc-200/60' 
    : 'bg-black/40 border-white/5';
    
  const textLabelColor = theme === 'light' 
    ? 'text-zinc-400' 
    : 'text-white/40';
    
  const textBodyColor = theme === 'light' 
    ? 'text-zinc-700' 
    : 'text-white/90';

  return (
    <div id="safety-widget" className={`flex items-start gap-4 p-5 rounded-[2rem] border backdrop-blur-md transition-all duration-500 ${bannerBg}`}>
      <div className={`p-3 rounded-2xl border flex-shrink-0 ${tipIconBg} ${tipIconColor}`}>
        <ActiveIcon className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-0.5 text-left">
        <span className={`text-[10px] font-mono tracking-wider uppercase ${textLabelColor}`}>
          {speedAlertState === 'overspeed' 
            ? (isFr ? 'Alerte Sécurité Routière' : 'Safety Threat Alert') 
            : (isFr ? 'Copilote de Sécurité en Direct' : 'Live Safety Assistant')}
        </span>
        <p className={`text-sm font-medium leading-relaxed font-sans mt-0.5 ${textBodyColor}`}>
          {dynamicTip}
        </p>
      </div>
    </div>
  );
}
