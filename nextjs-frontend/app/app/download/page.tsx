'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DownloadPage() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsAndroid(/android/i.test(ua));
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    // In production, point to actual APK URL
    const apkUrl = '/downloads/flavorfind.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'FlavorFind.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

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
                Your personal recipe assistant is ready! Download the ultra-lightweight FlavorFind app and start discovering amazing recipes based on the ingredients you have.
              </p>

              {/* Key Features List */}
              <div className="space-y-4 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold">1000+ Global Recipes</p>
                    <p className="text-gray-500 text-sm">Italian, Asian, Mexican, Indian, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold">Lightning-Fast Search</p>
                    <p className="text-gray-500 text-sm">Find recipes in seconds using ingredients you have</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold">Built-in Cook Timer</p>
                    <p className="text-gray-500 text-sm">Step-by-step instructions with timing features</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold">100% Free Forever</p>
                    <p className="text-gray-500 text-sm">No ads, no subscriptions, no in-app purchases</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold">Lightweight (3.8 MB)</p>
                    <p className="text-gray-500 text-sm">Minimal storage impact, maximum functionality</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-bold">Save Your Favorites</p>
                    <p className="text-gray-500 text-sm">Build your personal recipe collection</p>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 text-lg flex items-center justify-center gap-3"
                >
                  <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                  {downloading ? 'Downloading...' : 'Download APK (3.8 MB)'}
                </button>

                {!isAndroid && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm flex items-start gap-2">
                      <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                      <span>You're not on an Android device. You can still download the APK and transfer it to your Android device, or download from Google Play Store when available.</span>
                    </p>
                  </div>
                )}

                <div className="text-center text-sm text-gray-500">
                  💡 Tip: After download, open your file manager and tap the APK to install
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden md:block">
              <div className="relative">
                {/* Phone mockup */}
                <div className="mx-auto max-w-xs">
                  <div className="rounded-3xl overflow-hidden border-8 border-gray-800 bg-black shadow-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1512941691920-25bda36dc643?w=400&q=80"
                      alt="FlavorFind App Interface"
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Floating cards around phone */}
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
      </div>

      {/* ── Installation Guide ── */}
      <section className="bg-black border-t border-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl font-bold mb-12 text-center">Installation Guide</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                num: '1',
                title: 'Download',
                desc: 'Click the download button above to get the APK file',
                icon: '⬇️',
              },
              {
                num: '2',
                title: 'Locate File',
                desc: 'Open your file manager and find Downloads folder',
                icon: '📂',
              },
              {
                num: '3',
                title: 'Install',
                desc: 'Tap the APK file and select "Install" when prompted',
                icon: '⚙️',
              },
              {
                num: '4',
                title: 'Launch',
                desc: 'Find FlavorFind in your app drawer and start cooking!',
                icon: '🚀',
              },
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
                "Unknown app" warning?
              </h3>
              <p className="text-gray-400">This is normal! Go to Settings → Security → Enable "Unknown Sources" to allow APK installation.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                Installation failed?
              </h3>
              <p className="text-gray-400">Make sure you have at least 50 MB free storage. Clear cache in Settings if needed.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                Can't find the file?
              </h3>
              <p className="text-gray-400">Check your Downloads folder. If using Chrome, swipe up in the browser to find downloads.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i>
                App crashes on launch?
              </h3>
              <p className="text-gray-400">Try restarting your device and reinstalling. If persists, contact support@flavorfind.app</p>
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
            <a href="https://twitter.com/flavorfind" target="_blank" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-all">
              𝕏 Twitter
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
