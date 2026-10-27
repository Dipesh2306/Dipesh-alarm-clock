import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { vibrationService } from '../services/vibrationService';

interface Lap {
  index: number;
  timeMs: number;
  deltaMs: number;
}

interface StopwatchViewProps {
  lang: Language;
}

export const StopwatchView: React.FC<StopwatchViewProps> = ({ lang }) => {
  const t = translations[lang];

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [laps, setLaps] = useState<Lap[]>([]);

  const startOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startOffsetRef.current = performance.now() - elapsedMs;

      const loop = () => {
        setElapsedMs(performance.now() - startOffsetRef.current);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      animFrameRef.current = requestAnimationFrame(loop);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    vibrationService.vibrateBrief(40);
    setIsRunning(true);
  };

  const handlePause = () => {
    vibrationService.vibrateBrief(40);
    setIsRunning(false);
  };

  const handleReset = () => {
    vibrationService.vibrateBrief(40);
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
  };

  const handleLap = () => {
    vibrationService.vibrateBrief(50);
    const lastLapTime = laps.length > 0 ? laps[0].timeMs : 0;
    const deltaMs = elapsedMs - lastLapTime;
    const newLap: Lap = {
      index: laps.length + 1,
      timeMs: elapsedMs,
      deltaMs,
    };
    setLaps([newLap, ...laps]);
  };

  const formatStopwatch = (msTotal: number) => {
    const totalCentis = Math.floor(msTotal / 10);
    const centis = totalCentis % 100;
    const totalSec = Math.floor(totalCentis / 100);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60);

    return {
      minutes: min.toString().padStart(2, '0'),
      seconds: sec.toString().padStart(2, '0'),
      millis: centis.toString().padStart(2, '0'),
    };
  };

  const { minutes, seconds, millis } = formatStopwatch(elapsedMs);

  // Determine fastest and slowest lap
  let minDelta = Infinity;
  let maxDelta = -Infinity;
  if (laps.length > 1) {
    laps.forEach((l) => {
      if (l.deltaMs < minDelta) minDelta = l.deltaMs;
      if (l.deltaMs > maxDelta) maxDelta = l.deltaMs;
    });
  }

  return (
    <div className="space-y-6">
      {/* Stopwatch Hero Card */}
      <div className="rounded-3xl bg-[#0c101c] border border-white/10 p-8 sm:p-10 text-center shadow-2xl">
        <div className="inline-flex items-baseline justify-center font-mono font-black text-6xl sm:text-7xl text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          <span>{minutes}</span>
          <span className="text-amber-400 mx-1">:</span>
          <span>{seconds}</span>
          <span className="text-3xl sm:text-4xl text-cyan-400 ml-2">
            .{millis}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handleReset}
            title={t.reset}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <>
              <button
                onClick={handleLap}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Flag className="w-4 h-4 text-cyan-400" />
                <span>{t.lap}</span>
              </button>

              <button
                onClick={handlePause}
                className="px-8 py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-500/10"
              >
                <Pause className="w-5 h-5 fill-rose-300" />
                <span>{t.pause}</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xl shadow-amber-500/25"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{t.start}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lap Times List */}
      {laps.length > 0 && (
        <div className="bg-[#0f1422] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-[#13192b] border-b border-white/5 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>{t.laps}</span>
            <span>Split / Total</span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
            {laps.map((lap) => {
              const total = formatStopwatch(lap.timeMs);
              const split = formatStopwatch(lap.deltaMs);
              const isBest = laps.length > 1 && lap.deltaMs === minDelta;
              const isWorst = laps.length > 1 && lap.deltaMs === maxDelta;

              return (
                <div
                  key={lap.index}
                  className={`px-4 py-3 flex items-center justify-between text-sm font-mono transition-colors ${
                    isBest
                      ? 'text-emerald-400 bg-emerald-500/5'
                      : isWorst
                      ? 'text-rose-400 bg-rose-500/5'
                      : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-sans">
                      Lap {lap.index}
                    </span>
                    {isBest && (
                      <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Fastest
                      </span>
                    )}
                    {isWorst && (
                      <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        Slowest
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-bold">
                      +{split.minutes}:{split.seconds}.{split.millis}
                    </span>
                    <span className="text-xs text-slate-500 block font-normal">
                      {total.minutes}:{total.seconds}.{total.millis}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
