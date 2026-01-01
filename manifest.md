# AI UGC Influencer Video Generator - Proje Manifest

## 📋 Proje Özeti

Bu proje, metin girdisi alarak Replicate API ve ElevenLabs kullanarak AI tabanlı UGC (User Generated Content) influencer videoları oluşturan bir web uygulamasıdır. Uygulama sadece local ortamda çalışacak şekilde tasarlanmıştır.

## 🎯 Özellikler

- **Metin Girdisi**: Kullanıcı video için metin girebilir
- **Ses Sentezi**: ElevenLabs API ile metinden konuşma (TTS) dönüşümü
- **Video Oluşturma**: Replicate API ile AI tabanlı video üretimi
- **Video Önizleme**: Oluşturulan videoyu önizleme ve indirme
- **Local Çalışma**: Tüm işlemler local ortamda gerçekleşir

## 🛠️ Teknoloji Stack

### Frontend
- **Framework**: Next.js 14+ (React tabanlı)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui veya benzeri component library
- **State Management**: React Hooks / Zustand (gerekirse)
- **Form Handling**: React Hook Form

### Backend
- **API Routes**: Next.js API Routes (serverless functions)
- **API Client**: Axios veya Fetch API

### External APIs
- **Replicate API**: Video generation için
  - Model: Zeroscope, AnimateDiff veya benzeri video generation modelleri
- **ElevenLabs API**: Text-to-Speech için
  - Voice cloning veya standart TTS

### Development Tools
- **Package Manager**: npm veya yarn
- **TypeScript**: Type safety için
- **Environment Variables**: .env.local dosyası

## 📁 Proje Yapısı

```
uc/
├── manifest.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── .env.local.example
├── .gitignore
├── README.md
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── api/
│   │   │   ├── generate-video/
│   │   │   │   └── route.ts
│   │   │   ├── generate-audio/
│   │   │   │   └── route.ts
│   │   │   └── status/
│   │   │       └── route.ts
│   │   └── components/
│   │       ├── VideoGenerator.tsx
│   │       ├── TextInput.tsx
│   │       ├── VideoPreview.tsx
│   │       ├── AudioPlayer.tsx
│   │       └── LoadingState.tsx
│   ├── lib/
│   │   ├── replicate.ts
│   │   ├── elevenlabs.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
└── .env.local
```

## 🔑 API Gereksinimleri

### Replicate API
1. [Replicate](https://replicate.com) hesabı oluşturun
2. API token alın: https://replicate.com/account/api-tokens
3. Kullanılacak model belirlenir (örn: `anotherjesse/zeroscope-v2-xl`)

### ElevenLabs API
1. [ElevenLabs](https://elevenlabs.io) hesabı oluşturun
2. API key alın: https://elevenlabs.io/app/settings/api-keys
3. Voice ID seçin veya default voice kullanın

## 📦 Kurulum Adımları

### 1. Proje Başlatma
```bash
npx create-next-app@latest . --typescript --tailwind --app
```

### 2. Bağımlılıkları Yükleme
```bash
npm install axios replicate @elevenlabs/client
# veya
yarn add axios replicate @elevenlabs/client
```

### 3. Environment Variables
`.env.local` dosyası oluşturun:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=default_voice_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Development Server
```bash
npm run dev
# veya
yarn dev
```

## 🔄 İş Akışı

1. **Kullanıcı Metin Girişi**
   - Kullanıcı video için metin girer
   - İsteğe bağlı: Ses tonu, hız gibi parametreler

2. **Ses Oluşturma (ElevenLabs)**
   - Metin ElevenLabs API'ye gönderilir
   - Ses dosyası (MP3/WAV) oluşturulur
   - Ses dosyası geçici olarak saklanır

3. **Video Oluşturma (Replicate)**
   - Ses dosyası ve prompt Replicate API'ye gönderilir
   - Video generation başlatılır
   - Polling ile video generation durumu kontrol edilir

4. **Video İşleme**
   - Oluşturulan video URL'i alınır
   - Video önizleme gösterilir
   - Kullanıcı videoyu indirebilir

## 🎨 UI/UX Gereksinimleri

- **Ana Sayfa**: Metin girişi formu
- **Loading States**: Ses ve video oluşturma sırasında loading göstergeleri
- **Progress Bar**: Video generation progress'i
- **Video Player**: Oluşturulan videoyu oynatma
- **Download Button**: Video indirme butonu
- **Error Handling**: Hata durumlarında kullanıcı dostu mesajlar

## 🔒 Güvenlik Notları

- API key'ler `.env.local` dosyasında saklanmalı
- `.env.local` dosyası `.gitignore`'a eklenmeli
- API routes'da server-side validation yapılmalı
- Rate limiting düşünülebilir (local kullanım için opsiyonel)

## 📝 Geliştirme Notları

- **Error Handling**: Her API çağrısı için try-catch blokları
- **Type Safety**: TypeScript ile tip güvenliği
- **Responsive Design**: Mobil uyumlu tasarım
- **Loading States**: Kullanıcı deneyimi için loading göstergeleri
- **File Management**: Geçici dosyaların temizlenmesi

## 🚀 Gelecek İyileştirmeler (Opsiyonel)

- Video kalitesi seçenekleri
- Farklı ses tonları/karakterler
- Video süresi limitleri
- Batch processing (birden fazla video)
- Video editing özellikleri
- Thumbnail generation
- Video metadata ekleme

## 📚 Kaynaklar

- [Replicate API Documentation](https://replicate.com/docs)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## ✅ Checklist

- [ ] Next.js projesi kurulumu
- [ ] API key'lerin alınması
- [ ] Environment variables ayarlanması
- [ ] Replicate API entegrasyonu
- [ ] ElevenLabs API entegrasyonu
- [ ] UI component'lerinin oluşturulması
- [ ] Video generation flow'unun implementasyonu
- [ ] Error handling
- [ ] Loading states
- [ ] Video preview ve download
- [ ] Responsive design
- [ ] Testing (local)

---

**Not**: Bu manifest dosyası projenin geliştirilmesi için bir rehber niteliğindedir. Geliştirme sırasında gereksinimlere göre güncellenebilir.

