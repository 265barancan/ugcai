# AI UGC Video Generator

Replicate API ve çoklu TTS sağlayıcıları kullanarak metin ile AI tabanlı influencer videoları oluşturan web uygulaması.

## 🎙️ Seslendirme (TTS) Sağlayıcıları

Uygulama birden fazla TTS (Text-to-Speech) sağlayıcısını destekler:

### 1. **Edge TTS** (Önerilen - Tamamen Ücretsiz) 🌐
- **Ücretsiz**: Evet, sınırsız kullanım
- **API Key**: Gerekmez
- **Kalite**: Yüksek
- **Diller**: 100+ dil (Türkçe dahil)
- **Kurulum**: Hiçbir şey gerekmez, varsayılan olarak kullanılabilir

### 2. **Google Cloud Text-to-Speech** 🔊
- **Ücretsiz Tier**: Ayda 1-4 milyon karakter
- **API Key**: Gerekli
- **Kalite**: Çok yüksek (WaveNet teknolojisi)
- **Diller**: 50+ dil, 380+ ses
- **Kurulum**: 
  - [Google Cloud Console](https://console.cloud.google.com/) üzerinden proje oluşturun
  - Text-to-Speech API'yi etkinleştirin
  - API key oluşturun
  - `.env` dosyasına ekleyin: `GOOGLE_TTS_API_KEY=your_key_here`

### 3. **Azure Speech Service** ☁️
- **Ücretsiz Tier**: Ayda 500.000 karakter
- **API Key**: Gerekli
- **Kalite**: Yüksek
- **Diller**: 119 dil, 270+ ses
- **Kurulum**:
  - [Azure Portal](https://portal.azure.com/) üzerinden Speech Service oluşturun
  - API key ve region alın
  - `.env` dosyasına ekleyin:
    ```
    AZURE_SPEECH_KEY=your_key_here
    AZURE_SPEECH_REGION=eastus
    ```

### 4. **ElevenLabs** 🎙️
- **Ücretsiz Tier**: Sınırlı (aylık ücretsiz karakter)
- **API Key**: Gerekli
- **Kalite**: Çok yüksek (AI ses klonlama)
- **Diller**: Çoklu dil desteği
- **Kurulum**: 
  - [ElevenLabs](https://elevenlabs.io) hesabı oluşturun
  - API key alın: https://elevenlabs.io/app/settings/api-keys
  - `.env` dosyasına ekleyin: `ELEVENLABS_API_KEY=your_key_here`

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 2. Environment Variables

`.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Video Generation (Gerekli - En az bir tanesi)
REPLICATE_API_TOKEN=your_replicate_token_here
# veya
FAL_API_KEY=your_fal_key_here  # Fal.ai için (günlük 100 ücretsiz istek)
# veya
HUGGINGFACE_API_KEY=your_hf_key_here  # Hugging Face için (opsiyonel, günlük 1000 ücretsiz istek)

# TTS (Text-to-Speech) - Opsiyonel (Edge TTS ücretsiz ve API key gerektirmez)
ELEVENLABS_API_KEY=your_elevenlabs_key_here  # ElevenLabs için
GOOGLE_TTS_API_KEY=your_google_tts_key_here  # Google Cloud TTS için
AZURE_SPEECH_KEY=your_azure_speech_key_here  # Azure Speech için
AZURE_SPEECH_REGION=eastus  # Azure region (varsayılan: eastus)

# Diğer Ayarlar
ELEVENLABS_VOICE_ID=default_voice_id_here  # Opsiyonel: Belirtmezseniz varsayılan ses kullanılır
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Model API Keys (Opsiyonel - AI özellikleri için)
GEMINI_API_KEY=your_gemini_key_here  # Google Gemini için
GROK_API_KEY=your_grok_key_here      # xAI Grok için
DEEPSEEK_API_KEY=your_deepseek_key_here  # DeepSeek için
```

**Not:** 
- `.env` dosyası `.gitignore`'da olduğu için git'e commit edilmeyecektir.
- `ELEVENLABS_VOICE_ID` opsiyoneldir. Belirtmezseniz varsayılan ses (Rachel) kullanılır.
- Farklı bir ses kullanmak isterseniz ElevenLabs'den Voice ID alıp buraya ekleyebilirsiniz.

**API Key'leri Nasıl Alınır:**

**Video Generation:**
- **Replicate**: https://replicate.com/account/api-tokens
- **Fal.ai**: https://fal.ai/dashboard/keys
- **Hugging Face**: https://huggingface.co/settings/tokens

**Text-to-Speech (TTS):**
- **Edge TTS**: API key gerekmez (tamamen ücretsiz) ✅
- **ElevenLabs**: https://elevenlabs.io/app/settings/api-keys
- **Google Cloud TTS**: https://console.cloud.google.com/apis/credentials
- **Azure Speech**: https://portal.azure.com/ → Speech Service oluşturun

**AI Models:**
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **Grok (xAI)**: https://console.x.ai/
- **DeepSeek**: https://platform.deepseek.com/api_keys
- **Fal.ai**: https://fal.ai/dashboard (günlük 100 ücretsiz istek)
- **Hugging Face**: https://huggingface.co/settings/tokens (opsiyonel, günlük 1000 ücretsiz istek)

### 3. Development Server'ı Başlatın

```bash
npm run dev
# veya
yarn dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📖 Kullanım

1. Ana sayfada metin girişi alanına video için istediğiniz metni yazın
2. **Seslendirme Servisi** seçin (Edge TTS, Google Cloud TTS, Azure Speech veya ElevenLabs)
3. **Ses** seçin (seçtiğiniz servise göre sesler listelenir)
4. **Video Oluşturma Servisi** seçin (Replicate, Fal.ai veya Hugging Face)
5. Video ayarlarını yapın (süre, çözünürlük, stil)
6. "Video Oluştur" butonuna tıklayın
7. Sistem önce sesi oluşturur, ardından videoyu oluşturur
8. Oluşturulan videoyu önizleyebilir ve indirebilirsiniz

### 🎵 Ses Senkronizasyonu

**Replicate (Google Veo 3.1)** ses senkronizasyonunu destekler:
- ✅ Oluşturulan ses dosyası video ile otomatik olarak senkronize edilir
- ✅ Video, ses ile uyumlu hareketler ve ifadeler içerir
- ✅ Ses ve video birlikte oluşturulur, sonradan birleştirme gerekmez

**Fal.ai ve Hugging Face**:
- ⚠️ Bu servislerde ses desteği sınırlıdır veya model bazlıdır
- ⚠️ Ses dosyası oluşturulur ancak video ile otomatik senkronizasyon olmayabilir
- ⚠️ Video ve ses ayrı ayrı oluşturulur, manuel birleştirme gerekebilir

**💡 Öneri**: En iyi ses senkronizasyonu için **Replicate (Google Veo 3.1)** kullanın.

## 🛠️ Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Replicate API** - Video generation
- **ElevenLabs API** - Text-to-Speech
- **FFmpeg** - Video processing (client-side ve server-side desteği)

## ✂️ Video İşleme (Trim & Export)

Uygulama hem **client-side** hem de **server-side** video işleme desteği sunar:

### Client-Side (Varsayılan - Önerilen)
- ✅ **FFmpeg.wasm** kullanır - tarayıcıda çalışır
- ✅ Sunucu kurulumu gerektirmez
- ✅ Her zaman çalışır
- ✅ Video trim ve export özellikleri mevcuttur

### Server-Side (Opsiyonel)
- ⚙️ **fluent-ffmpeg** kullanır - sunucuda çalışır
- ⚙️ Sunucuda FFmpeg binary'si gerektirir
- ⚙️ Daha hızlı işleme (büyük dosyalar için)
- ⚙️ Kurulum:
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt-get install ffmpeg
  
  # Windows
  # https://ffmpeg.org/download.html adresinden indirin
  ```

**Not**: Server-side FFmpeg yoksa, uygulama otomatik olarak client-side çözümü kullanır.

## 📝 Notlar

- Video oluşturma işlemi birkaç dakika sürebilir
- API kullanım limitlerinize dikkat edin
- Local ortamda çalışmak için tasarlanmıştır
- Video trim ve export özellikleri client-side FFmpeg ile çalışır (sunucu kurulumu gerekmez)

## 🔧 Geliştirme

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

