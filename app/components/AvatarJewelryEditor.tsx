"use client";

import { useState, useEffect, useRef } from "react";
import { useToast, ToastContainer } from "./ToastContainer";
import { getAllAvatars, SavedAvatar, saveAvatar } from "@/lib/avatarHistory";
import LoadingState from "./LoadingState";

interface JewelryPosition {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  scale: number; // Scale factor (0.1 - 2.0)
  rotation: number; // Rotation in degrees
}

export default function AvatarJewelryEditor() {
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<SavedAvatar | null>(null);
  const [jewelryImage, setJewelryImage] = useState<string | null>(null);
  const [jewelryFile, setJewelryFile] = useState<File | null>(null);
  const [position, setPosition] = useState<JewelryPosition>({
    x: 50,
    y: 30,
    scale: 1.0,
    rotation: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Load saved avatars on mount
  useEffect(() => {
    const avatars = getAllAvatars();
    setSavedAvatars(avatars);
  }, []);

  // Handle jewelry file upload
  const handleJewelryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Lütfen bir görsel dosyası seçin");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("Dosya boyutu 10MB'dan küçük olmalıdır");
      return;
    }

    setJewelryFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setJewelryImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle jewelry URL input
  const handleJewelryUrl = (url: string) => {
    if (!url.trim()) {
      setJewelryImage(null);
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
      setJewelryImage(url);
    } catch {
      showError("Geçersiz URL formatı");
    }
  };

  // Combine avatar and jewelry using canvas
  const combineImages = async () => {
    if (!selectedAvatar || !jewelryImage) {
      showError("Lütfen avatar ve takı görseli seçin");
      return;
    }

    setIsProcessing(true);
    setResultImage(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas bulunamadı");
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context alınamadı");
      }

      // Load avatar image
      const avatarImg = new Image();
      avatarImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        avatarImg.onload = resolve;
        avatarImg.onerror = reject;
        avatarImg.src = selectedAvatar.imageUrl;
      });

      // Set canvas size to avatar size
      canvas.width = avatarImg.width;
      canvas.height = avatarImg.height;

      // Draw avatar
      ctx.drawImage(avatarImg, 0, 0);

      // Load jewelry image
      const jewelryImg = new Image();
      jewelryImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        jewelryImg.onload = resolve;
        jewelryImg.onerror = reject;
        jewelryImg.src = jewelryImage;
      });

      // Calculate jewelry dimensions and position
      const scale = position.scale;
      const jewelryWidth = jewelryImg.width * scale;
      const jewelryHeight = jewelryImg.height * scale;

      // Convert percentage to pixel coordinates
      const x = (position.x / 100) * canvas.width - jewelryWidth / 2;
      const y = (position.y / 100) * canvas.height - jewelryHeight / 2;

      // Save context
      ctx.save();

      // Move to center of jewelry, rotate, then draw
      const centerX = x + jewelryWidth / 2;
      const centerY = y + jewelryHeight / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((position.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      // Draw jewelry
      ctx.drawImage(jewelryImg, x, y, jewelryWidth, jewelryHeight);

      // Restore context
      ctx.restore();

      // Convert canvas to image
      const resultUrl = canvas.toDataURL("image/png");
      setResultImage(resultUrl);
      success("Avatar ve takı başarıyla birleştirildi!");
    } catch (error: any) {
      console.error("Error combining images:", error);
      showError(error.message || "Görseller birleştirilirken bir hata oluştu");
    } finally {
      setIsProcessing(false);
    }
  };

  // Save combined result
  const handleSaveResult = () => {
    if (!resultImage || !selectedAvatar) {
      showError("Kaydetmek için birleştirilmiş görsel gerekli");
      return;
    }

    try {
      const newPrompt = `${selectedAvatar.prompt} - Takı ile`;
      saveAvatar(
        resultImage,
        newPrompt,
        selectedAvatar.model,
        [...(selectedAvatar.tags || []), "jewelry", "combined"]
      );
      success("Birleştirilmiş avatar kaydedildi!");
    } catch (error: any) {
      console.error("Error saving result:", error);
      showError(error.message || "Kaydetme sırasında bir hata oluştu");
    }
  };

  // Download result
  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `avatar-with-jewelry-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Görsel indirildi!");
  };

  // Reset position
  const resetPosition = () => {
    setPosition({
      x: 50,
      y: 30,
      scale: 1.0,
      rotation: 0,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Avatar Takı Giydirme
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Kaydedilmiş avatarlarınıza takı görseli ekleyin ve birleştirin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avatar Seçin
            </label>
            {savedAvatars.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Henüz kaydedilmiş avatar yok
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Önce Avatar Oluşturucu'da bir avatar oluşturup kaydedin
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAvatar?.id === avatar.id
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                    }`}
                  >
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.prompt}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {avatar.prompt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Jewelry Upload & Preview */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Takı Görseli
            </label>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Dosya Yükle
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleJewelryUpload}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-600 file:text-white
                  hover:file:bg-purple-700
                  file:cursor-pointer"
              />
            </div>

            {/* URL Input */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                veya URL Girin
              </label>
              <input
                type="url"
                placeholder="https://example.com/jewelry.png"
                onChange={(e) => handleJewelryUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Jewelry Preview */}
            {jewelryImage && (
              <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Takı Önizleme
                </p>
                <img
                  src={jewelryImage}
                  alt="Jewelry"
                  className="w-full h-32 object-contain rounded"
                />
              </div>
            )}
          </div>

          {/* Position Controls */}
          {selectedAvatar && jewelryImage && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pozisyon Ayarları
              </h3>

              {/* X Position */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  X Pozisyonu: {position.x.toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.x}
                  onChange={(e) =>
                    setPosition({ ...position, x: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Y Position */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Y Pozisyonu: {position.y.toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.y}
                  onChange={(e) =>
                    setPosition({ ...position, y: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Scale */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Boyut: {(position.scale * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={position.scale}
                  onChange={(e) =>
                    setPosition({
                      ...position,
                      scale: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Döndürme: {position.rotation.toFixed(0)}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={position.rotation}
                  onChange={(e) =>
                    setPosition({
                      ...position,
                      rotation: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <button
                onClick={resetPosition}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
              >
                Sıfırla
              </button>
            </div>
          )}

          {/* Combine Button */}
          {selectedAvatar && jewelryImage && (
            <button
              onClick={combineImages}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isProcessing ? "Birleştiriliyor..." : "🔄 Birleştir"}
            </button>
          )}
        </div>

        {/* Right Column: Result Preview */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sonuç
            </label>

            {isProcessing && (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <LoadingState
                  status={{
                    status: "generating-video",
                    message: "Görseller birleştiriliyor...",
                    progress: undefined,
                  }}
                />
              </div>
            )}

            {!isProcessing && resultImage && (
              <div className="space-y-4">
                <div className="relative bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <img
                    src={resultImage}
                    alt="Combined result"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveResult}
                    className="flex-1 bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    💾 Kaydet
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    📥 İndir
                  </button>
                </div>
              </div>
            )}

            {!isProcessing && !resultImage && (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 border-dashed">
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <svg
                    className="mx-auto h-16 w-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium">Sonuç burada görünecek</p>
                  <p className="text-sm mt-2">
                    Avatar ve takı seçip birleştirin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 İpucu:</strong> Takı görselini yükledikten sonra pozisyon,
          boyut ve döndürme ayarlarını kullanarak takıyı avatara uygun şekilde
          yerleştirin. "Birleştir" butonuna tıklayarak sonucu önizleyin ve
          kaydedin.
        </p>
      </div>
    </div>
  );
}
