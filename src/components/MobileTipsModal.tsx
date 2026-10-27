import React from 'react';
import { X, Smartphone, Bell, Volume2, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { notificationService } from '../services/notificationService';
import { soundEngine } from '../services/soundEngine';
import { vibrationService } from '../services/vibrationService';

interface MobileTipsModalProps {
  lang: Language;
  onClose: () => void;
}

export const MobileTipsModal: React.FC<MobileTipsModalProps> = ({ lang, onClose }) => {
  const t = translations[lang];

  const handleTestNotification = async () => {
    soundEngine.unlockAudio();
    vibrationService.vibrateBrief(200);
    const perm = await notificationService.requestPermission();
    if (perm === 'granted') {
      notificationService.showAlarmNotification(
        lang === 'hi' ? 'अलार्म टेस्ट सफल!' : 'Alarm Test Successful!',
        lang === 'hi' ? 'आपके फोन पर अलार्म नोटिफिकेशन सही से काम कर रहा है।' : 'Your mobile alarm notifications are working properly.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#0c101c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#111728]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              {t.mobileTipsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
          <p className="text-slate-400">
            {t.mobileTipsDesc}
          </p>

          {/* Tip 1 */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-bold text-white text-xs mb-1">
                {lang === 'hi' ? 'ब्राउज़र टैब को खुला रखें' : 'Keep tab open at night'}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {lang === 'hi'
                  ? 'रात को सोते समय इस टैब को खुला रखें या ऊपर दिए गए 🌙 (Nightstand) बटन को दबाकर स्क्रीन पर रख दें। स्क्रीन बंद नहीं होगी!'
                  : 'Keep this browser tab open overnight or switch on Nightstand mode (🌙). Wake-lock will keep your screen gently active.'}
              </p>
            </div>
          </div>

          {/* Tip 2 */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-bold text-white text-xs mb-1">
                {lang === 'hi' ? 'मीडिया वॉल्यूम बढ़ाएँ और साइलेंट ऑफ करें' : 'Unmute & Turn Up Media Volume'}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {lang === 'hi'
                  ? 'अपने फोन के साइड बटन से "Media Volume" को 80-100% पर रखें और यदि फोन साइलेंट / DND पर है तो उसे नॉर्मल रिंगर मोड में करें।'
                  : 'Ensure your phone hardware ring/silent switch is unmuted and the Media volume slider is turned up loud.'}
              </p>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-bold text-white text-xs mb-1">
                {lang === 'hi' ? 'स्क्रीन पर टच करके ऑडियो सक्रिय करें' : 'Unlock Audio Permission'}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {lang === 'hi'
                  ? 'मोबाइल ब्राउज़र सुरक्षा के लिए पहली बार स्क्रीन छूने पर ही तेज़ आवाज़ बजाने की अनुमति देते हैं।'
                  : 'Mobile browsers require a single user tap on the screen to permit loud audio playback.'}
              </p>
            </div>
          </div>

          {/* Tip 4 - Home Screen */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex gap-3 items-start text-purple-200">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-xs mb-1">
                {lang === 'hi' ? 'मोबाइल होम स्क्रीन पर जोड़ें (Add to Home Screen)' : 'Add to Home Screen (Mobile App)'}
              </p>
              <p className="text-purple-300/80 leading-relaxed">
                {lang === 'hi'
                  ? 'Chrome/Safari में ऊपर या नीचे के मेनू (3 डॉट्स या Share) पर क्लिक करें और "Add to Home screen" चुनें। यह आपके फोन पर असली ऐप की तरह दिखेगा!'
                  : 'In Chrome/Safari menu, tap "Add to Home screen". It will install as a standalone mobile app icon on your phone!'}
              </p>
            </div>
          </div>

          {/* Test Action */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleTestNotification}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नोटिफिकेशन टेस्ट करें' : 'Test Notification'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111728] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {lang === 'hi' ? 'समझ गया (Got it)' : 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};
