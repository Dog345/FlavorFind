'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Arch = 'arm64' | 'arm32' | 'x86_64' | null;

const APK_VARIANTS = [
  {
    id: 'arm64' as Arch,
    label: 'ARM 64-bit',
    filename: 'flavorfind-arm64.apk',
    size: '22 MB',
    badge: '⭐ Recommended',
    badgeColor: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
    desc: 'Modern Android phones (2017+)',
    devices: 'Most flagship & mid-range phones',
    icon: '📱',
  },
  {
    id: 'arm32' as Arch,
    label: 'ARM 32-bit',
    filename: 'flavorfind-arm32.apk',
    size: '19 MB',
    badge: 'Older Devices',
    badgeColor: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    desc: 'Older Android phones (pre-2017)',
    devices: 'Budget phones & older devices',
    icon: '📲',
  },
  {
    id: 'x86_64' as Arch,
    label: 'x86 64-bit',
    filename: 'flavorfind-x86_64.apk',
    size: '23 MB',
    badge: 'Emulator',
    badgeColor: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    desc: 'Android emulators & Chromebooks',
    devices: 'PC emulators, some Chromebooks',
    icon: '💻',
  },
];

function detectArch(): Arch {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;
  if (!ua) return null;
  // x86_64 emulators / Chromebooks
  if (/x86_64|x86-64|Win64|WOW64/i.test(ua)) return 'x86_64';
  // ARM64 — modern Android (arm64 or aarch64 in UA or via navigator.platform on some browsers)
  if (/arm64|aarch64|armv8/i.test(ua)) return 'arm64';
  // Fallback for generic Android: most modern phones are arm64; only flag arm32 for very old UAs
  if (/android/i.test(ua)) {
    // If it explicitly says armv7 or older, pick arm32
    if (/armv7|armv6|armeabi/i.test(ua)) return 'arm32';
    // Otherwise assume modern arm64
    return 'arm64';
  }
  return null;
}

export default function DownloadPage() {
  const [detectedArch, setDetectedArch] = useState<Arch>(null);
  const [selectedArch, setSelectedArch] = useState<Arch>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [downloading, setDownloading] = useState<Arch>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsAndroid(/android/i.test(ua));
    const arch = detectArch();
    setDetectedArch(arch);
    setSelectedArch(arch ?? 'arm64'); // default to arm64 if undetected
  }, []);

  const handleDownload = (arch: Arch) => {
    if (!arch) return;
    const variant = APK_VARIANTS.find((v) => v.id === arch);
    if (!variant) return;
    setDownloading(arch);
    const link = document.createElement('a');
    link.href = `/downloads/${variant.filename}`;
    link.download = `FlavorFind-${variant.label.replace(/\s+/g, '-')}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 2000);
  };

  const selectedVariant = APK_VARIANTS.find((v) => v.id === selectedArch) ?? APK_VARIANTS[0];

  return (
    <>
      {/* ── Header ── */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-orange-500">Flavor</span>Find
          </Link>
          <Link href="/app" className="text-gray-400 hover:text-white transition-all">
            Back to App
          </Link>
        </div>
      </div>

      {/* ── Main Download Section ── */}
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-black to-gray-900/50 flex items-center">
        <div className="max-w-4xl mx-auto px-4 md:px-8 w-full py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Info */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-4 py-2 rounded-full mb-6">
                <i className="fas fa-check-circle"></i> Ready to Download
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                Get <span className="text-orange-500">FlavorFind</span> Now
              </h1>

              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Your personal recipe assistant is ready! Download the FlavorFind app and start discovering amazing recipes based on the ingredients you have.
              </p>

              {/* Key Features List */}
              <div className="space-y-4 mb-10">
                {[
                  { title: '1000+ Global Recipes', sub: 'Italian, Asian, Mexican, Indian, and more' },
                  { title: 'Lightning-Fast Search', sub: 'Find recipes in seconds using ingredients you have' },
                  { title: 'Built-in Cook Timer', sub: 'Step-by-step instructions with timing features' },
                  { title: '100% Free Forever', sub: 'No ads, no subscriptions, no in-app purchases' },
                  { title: 'Save Your Favorites', sub: 'Build your personal recipe collection' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <i className="fas fa-check text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-detection notice */}
              {detectedArch && isAndroid && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <p className="text-green-400 text-sm flex items-start gap-2">
                    <i className="fas fa-microchip mt-0.5 flex-shrink-0"></i>
                    <span>
                      <strong>Auto-detected:</strong> Your device uses{' '}
                      <strong>{APK_VARIANTS.find((v) => v.id === detectedArch)?.label}</strong> architecture.
                      The right version is pre-selected below.
                    </span>
                  </p>
                </div>
              )}

              {!isAndroid && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 text-sm flex items-start gap-2">
                    <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                    <span>
                      You&apos;re not on an Android device. You can still download the APK and transfer
                      it to your Android device. For most phones, pick <strong>ARM 64-bit</strong>.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Right: Visual */}
            <div className="hidden md:block">
              <div className="relative mx-auto max-w-xs">
                <div className="rounded-3xl overflow-hidden border-8 border-gray-800 bg-black shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1512941691920-25bda36dc643?w=400&q=80"
                    alt="FlavorFind App Interface"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -top-8 -right-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 w-40 shadow-xl">
                  <p className="text-white text-sm font-bold">⭐ 4.9 Rating</p>
                  <p className="text-gray-300 text-xs">Loved by 50K+ users</p>
                </div>
                <div className="absolute -bottom-8 -left-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 w-40 shadow-xl">
                  <p className="text-white text-sm font-bold">🚀 Lightning Fast</p>
                  <p className="text-gray-300 text-xs">Search in milliseconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── APK Variant Picker ── */}
      <section className="bg-black border-t border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Choose Your Version</h2>
            <p className="text-gray-400">
              {detectedArch
                ? 'We auto-detected your device architecture — the right version is highlighted.'
                : 'Not sure which to pick? Go with ARM 64-bit — it works on most modern phones.'}
            </p>
          </div>

          {/* Variant Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {APK_VARIANTS.map((v) => {
              const isSelected = selectedArch === v.id;
              const isDetected = detectedArch === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedArch(v.id)}
                  className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
                  }`}
                >
                  {isDetected && (
                    <span className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Your Device
                    </span>
                  )}
                  <div className="text-3xl mb-3">{v.icon}</div>
                  <p className="font-bold text-lg mb-1">{v.label}</p>
                  <span className={`inline-block text-xs border px-2 py-0.5 rounded-full mb-3 ${v.badgeColor}`}>
                    {v.badge}
                  </span>
                  <p className="text-gray-400 text-sm mb-1">{v.desc}</p>
                  <p className="text-gray-500 text-xs mb-3">{v.devices}</p>
                  <p className="text-orange-400 font-bold text-sm">{v.size}</p>
                </button>
              );
            })}
          </div>

          {/* Download Button for selected */}
          <div className="space-y-4">
            <button
              onClick={() => handleDownload(selectedArch)}
              disabled={downloading !== null}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 text-lg flex items-center justify-center gap-3"
            >
              <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
              {downloading
                ? 'Downloading...'
                : `Download ${selectedVariant.label} APK (${selectedVariant.size})`}
            </button>

            {/* Quick links for all 3 */}
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              {APK_VARIANTS.filter((v) => v.id !== selectedArch).map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleDownload(v.id)}
                  disabled={downloading !== null}
                  className="text-sm text-gray-400 hover:text-orange-400 transition-all underline underline-offset-2 disabled:opacity-50"
                >
                  Download {v.label} ({v.size})
                </button>
              ))}
            </div>

            <div className="text-center text-sm text-gray-500">
              💡 Tip: After download, open your file manager and tap the APK to install
            </div>
          </div>
        </div>
      </section>

      {/* ── Installation Guide ── */}
      <section className="bg-black border-t border-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl font-bold mb-12 text-center">Installation Guide</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Download', desc: 'Pick your device architecture and tap the download button', icon: '⬇️' },
              { num: '2', title: 'Locate File', desc: 'Open your file manager and find the Downloads folder', icon: '📂' },
              { num: '3', title: 'Install', desc: 'Tap the APK file and select "Install" when prompted', icon: '⚙️' },
              { num: '4', title: 'Launch', desc: 'Find FlavorFind in your app drawer and start cooking!', icon: '🚀' },
            ].map((step, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/3 -right-4 w-8 h-1 bg-gradient-to-r from-orange-500 to-transparent"></div>
                )}
                <div className="bg-gray-900/50 rounded-xl p-6 text-center border border-gray-800 hover:border-orange-500/30 transition-all">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <p className="text-orange-500 font-bold text-sm mb-2">Step {step.num}</p>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Troubleshooting ── */}
      <section className="bg-gradient-to-b from-black to-gray-900 py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl font-bold mb-12 text-center">Troubleshooting</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                &quot;Unknown app&quot; warning?
              </h3>
              <p className="text-gray-400">This is normal! Go to Settings → Security → Enable &quot;Unknown Sources&quot; to allow APK installation.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                Installation failed?
              </h3>
              <p className="text-gray-400">Make sure you have at least 50 MB free storage. Try a different architecture variant if the issue persists.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                Which version should I pick?
              </h3>
              <p className="text-gray-400">
                Most modern phones (2017+) use <strong className="text-white">ARM 64-bit</strong>. Older budget phones use ARM 32-bit. Emulators use x86 64-bit.
              </p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                App crashes on launch?
              </h3>
              <p className="text-gray-400">Try a different architecture variant. If it persists, contact support@flavorfind.app</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Support CTA ── */}
      <section className="bg-orange-500/5 border-y border-orange-500/20 py-12">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
          <p className="text-gray-400 mb-6">Contact our support team</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:support@flavorfind.app" className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all">
              📧 Email Support
            </a>
            <a href="https://twitter.com/flavorfind" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-all">
              𝕏 Twitter
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
