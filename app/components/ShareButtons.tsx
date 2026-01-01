"use client";

import { useState } from "react";

interface ShareButtonsProps {
  videoUrl: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}

export default function ShareButtons({
  videoUrl,
  title = "AI UGC Video",
  description = "Bu videoyu izleyin!",
  thumbnailUrl,
}: ShareButtonsProps) {
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showEmailShare, setShowEmailShare] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailData, setEmailData] = useState({ to: "", subject: title, message: description });
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [generatingShortUrl, setGeneratingShortUrl] = useState(false);

  const shareText = `${title} - ${description}`;
  const encodedUrl = encodeURIComponent(videoUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
    tumblr: `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodedUrl}&title=${encodedText}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = videoUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const embedCode = `<iframe src="${videoUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = embedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateQRCode = (url: string): string => {
    // Using a QR code API service (qrcode.tec-it.com)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handleGenerateShortUrl = async () => {
    setGeneratingShortUrl(true);
    try {
      // Using a URL shortening service (you can replace with your own API)
      // For demo purposes, we'll use a simple approach
      // In production, you'd use a service like bit.ly, tinyurl, or your own backend
      const response = await fetch("/api/shorten-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await response.json();
      if (data.success && data.shortUrl) {
        setShortUrl(data.shortUrl);
      } else {
        // Fallback: create a simple hash-based short URL
        const hash = btoa(videoUrl).substring(0, 10).replace(/[+/=]/g, "");
        setShortUrl(`${window.location.origin}/v/${hash}`);
      }
    } catch (error) {
      // Fallback: create a simple hash-based short URL
      const hash = btoa(videoUrl).substring(0, 10).replace(/[+/=]/g, "");
      setShortUrl(`${window.location.origin}/v/${hash}`);
    } finally {
      setGeneratingShortUrl(false);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(`${emailData.message}\n\n${videoUrl}`);
    window.location.href = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: videoUrl,
        });
      } catch (err) {
        console.error("Native share failed:", err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Paylaş
      </h3>

      {/* Native Share (Mobile) */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <span>📱</span>
          <span>Paylaş (Cihaz)</span>
        </button>
      )}

      {/* Social Media Buttons */}
      <div className="flex flex-wrap gap-2">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
        >
          <span>🐦</span>
          <span>Twitter</span>
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>📘</span>
          <span>Facebook</span>
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
        >
          <span>💼</span>
          <span>LinkedIn</span>
        </a>
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </a>
        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>✈️</span>
          <span>Telegram</span>
        </a>
        <a
          href={shareLinks.reddit}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <span>🔴</span>
          <span>Reddit</span>
        </a>
        <a
          href={shareLinks.pinterest}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <span>📌</span>
          <span>Pinterest</span>
        </a>
      </div>

      {/* Copy Link */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={shortUrl || videoUrl}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
          />
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-lg transition-colors ${
              copied
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            {copied ? "✓ Kopyalandı" : "📋 Kopyala"}
          </button>
        </div>
        {!shortUrl && (
          <button
            onClick={handleGenerateShortUrl}
            disabled={generatingShortUrl}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            {generatingShortUrl ? "Oluşturuluyor..." : "🔗 Kısa URL Oluştur"}
          </button>
        )}
        {shortUrl && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-800 dark:text-green-200">
              ✓ Kısa URL oluşturuldu: {shortUrl}
            </p>
          </div>
        )}
      </div>

      {/* Email Share */}
      <div className="space-y-2">
        <button
          onClick={() => setShowEmailShare(!showEmailShare)}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>{showEmailShare ? "▼" : "▶"}</span>
          <span>📧 Email ile Paylaş</span>
        </button>
        {showEmailShare && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alıcı Email
              </label>
              <input
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="ornek@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Konu
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mesaj
              </label>
              <textarea
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleEmailShare}
              disabled={!emailData.to}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              📧 Email Gönder
            </button>
          </div>
        )}
      </div>

      {/* Embed Code */}
      <div className="space-y-2">
        <button
          onClick={() => setShowEmbedCode(!showEmbedCode)}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>{showEmbedCode ? "▼" : "▶"}</span>
          <span>Embed Kodu</span>
        </button>
        {showEmbedCode && (
          <div className="space-y-2">
            <textarea
              value={embedCode}
              readOnly
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-mono"
            />
            <button
              onClick={handleCopyEmbedCode}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              {copied ? "✓ Embed Kodu Kopyalandı" : "📋 Embed Kodunu Kopyala"}
            </button>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="space-y-2">
        <button
          onClick={() => setShowQRCode(!showQRCode)}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>{showQRCode ? "▼" : "▶"}</span>
          <span>QR Kod</span>
        </button>
        {showQRCode && (
          <div className="flex flex-col items-center space-y-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img
              src={generateQRCode(videoUrl)}
              alt="QR Code"
              className="w-48 h-48 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              QR kodu tarayarak videoyu görüntüleyebilirsiniz
            </p>
            <a
              href={generateQRCode(videoUrl)}
              download="video-qr-code.png"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              📥 QR Kodunu İndir
            </a>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <div className="space-y-2">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>{showAdvancedOptions ? "▼" : "▶"}</span>
          <span>⚙️ Gelişmiş Seçenekler</span>
        </button>
        {showAdvancedOptions && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paylaşım Önizlemesi
              </label>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 truncate">
                  {shortUrl || videoUrl}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Etiketleri (SEO)
              </label>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>og:title:</strong> {title}</p>
                <p><strong>og:description:</strong> {description}</p>
                <p><strong>og:url:</strong> {shortUrl || videoUrl}</p>
                {thumbnailUrl && <p><strong>og:image:</strong> {thumbnailUrl}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

