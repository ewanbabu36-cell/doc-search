import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import {
  AirtelThanksConsumerExperienceView as ConsumerView
} from '@docsearch/consumer-portal';

export const AirtelThanksConsumerExperienceView: React.FC = () => {
  const [deviceFrame, setDeviceFrame] = useState<'MOBILE' | 'FULL'>('MOBILE');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'AUDIT_METRICS' | 'API_BRIDGE'>('PREVIEW');

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4 border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📱</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">DocSearch Consumer Super-App</h1>
                <Badge variant="success">Airtel Thanks Inspired UI/UX</Badge>
                <Badge variant="info">WCAG AA Compliant</Badge>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Zero-Cognitive Load Patient Experience: Hero Circular Ring, 1-Tap Family Health Tree, 4x2 Squircle Actions, 0% Surgery EMI & Real-Time Stepper.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark / Light Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {isDarkMode ? '☀️ Light View' : '🌙 Dark View'}
          </Button>

          {/* Device Frame Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeviceFrame(deviceFrame === 'MOBILE' ? 'FULL' : 'MOBILE')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {deviceFrame === 'MOBILE' ? '🖥️ Expanded Tablet' : '📱 Smartphone Frame'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'PREVIEW' ? 'AUDIT_METRICS' : 'PREVIEW')}
          >
            {activeTab === 'PREVIEW' ? '📊 View Architecture & Metrics' : '👁️ View Live App Preview'}
          </Button>
        </div>
      </div>

      {activeTab === 'AUDIT_METRICS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭕</span>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Pillar 1: Circular Progress Ring</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Calculates circumference (2 * π * r = 238.76px) with dynamic stroke-dashoffset rendering active care pass validity or 30-day medication adherence.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs font-mono">
              Ring Circumference: 238.76px<br />
              Animation: 800ms Ease Transition<br />
              Contrast Ratio: 7.2:1 (AAA Pass)
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍👩‍👧</span>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Pillar 2: Family Health Tree Switcher</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sticky header pill trigger opening a non-blocking animated bottom sheet with instant profile reload without page refresh.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs font-mono">
              Switch Latency: &lt;50ms<br />
              Context Scoping: UHID, Rx, Wallet<br />
              Zero Full-Page Reload
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Pillar 5: Real-Time Stepper</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              4-Step dual-mode status pipeline supporting live OPD Chamber queue differential and Cold-Chain verified phlebotomy collection.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs font-mono">
              Modes: OPD Queue &amp; Home Blood Draw<br />
              Cold Chain Monitoring: 2°C - 8°C<br />
              Delay Escalation Guard Active
            </div>
          </Card>
        </div>
      ) : (
        /* Device Simulator Frame */
        <div className="flex justify-center py-4 bg-slate-950/20 rounded-3xl p-6 border border-slate-800/50">
          <div
            style={{
              width: deviceFrame === 'MOBILE' ? '414px' : '100%',
              maxWidth: deviceFrame === 'MOBILE' ? '414px' : '900px',
              borderRadius: deviceFrame === 'MOBILE' ? '36px' : '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 10px #1E293B',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Phone Speaker Notch (Mobile Frame Only) */}
            {deviceFrame === 'MOBILE' && (
              <div
                style={{
                  backgroundColor: '#0F172A',
                  padding: '8px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '5px',
                    backgroundColor: '#334155',
                    borderRadius: '3px'
                  }}
                />
              </div>
            )}

            {/* Embedded Live Consumer Super-App */}
            <ConsumerView isDarkMode={isDarkMode} />
          </div>
        </div>
      )}
    </div>
  );
};
