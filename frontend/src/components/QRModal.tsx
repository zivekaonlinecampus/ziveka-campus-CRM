import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Representative, ReferralCode } from '../types';
import { X, Copy, Check, Download, Share2, QrCode as QrIcon } from 'lucide-react';
import QRCode from 'qrcode';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  representative: Representative | null;
  referralCode?: ReferralCode | null;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  representative,
  referralCode,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeCode = referralCode?.code || representative?.active_referral_code?.code || 'ZV-CMB-DEMO';
  const publicUrl = `${window.location.origin}/#/r/${activeCode}`;

  useEffect(() => {
    if (isOpen && activeCode) {
      QRCode.toDataURL(
        publicUrl,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
  }, [isOpen, activeCode, publicUrl]);

  if (!isOpen || !representative) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `Ziveka-QR-${activeCode}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleWhatsAppShare = () => {
    const text = `${t('whatsAppMessage')} ${publicUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3 text-amber-300 border border-white/20">
            <QrIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">{t('navReferralTools')}</h3>
          <p className="text-xs text-indigo-200 mt-1">
            {representative.user?.name} • {representative.representative_id}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-6 text-center">
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-indigo-200 inline-block shadow-inner mb-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Referral QR Code" className="w-52 h-52 mx-auto rounded-lg" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 py-1.5 px-3 rounded-lg inline-block mb-4 border border-indigo-100">
            {t('refCodeLabel')}: {activeCode}
          </div>

          {/* Copy Public Link Box */}
          <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-xl border border-slate-200 mb-5">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="bg-transparent text-xs text-slate-700 font-mono grow px-2 outline-hidden truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copyLink')}</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadQR')}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('shareWhatsApp')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
