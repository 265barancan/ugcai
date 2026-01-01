# GitHub Repository Bağlama ve Otomatik Güncelleme Rehberi

## 1. Git Repository'sini Başlatma

Terminal'de proje klasörüne gidin ve şu komutları çalıştırın:

```bash
cd "/Volumes/Veporta/Projeler/Web apps/uc"

# Git repository'sini başlat
git init

# Tüm dosyaları staging area'ya ekle
git add .

# İlk commit'i yap
git commit -m "Initial commit: AI UGC Video Generator"
```

## 2. GitHub Repository'sine Bağlama

GitHub'da repository'nizi oluşturduktan sonra (örnek: `username/ai-ugc-video-generator`):

```bash
# Remote repository'yi ekle (YOUR_USERNAME ve REPO_NAME'i değiştirin)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Veya SSH kullanıyorsanız:
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# Ana branch'i main olarak ayarla
git branch -M main

# İlk push'u yap
git push -u origin main
```

## 3. Otomatik Güncelleme İçin GitHub Actions

### A. Otomatik Deploy için Workflow Dosyası

`.github/workflows/deploy.yml` dosyası oluşturun:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          # Gerekli environment variables'ları GitHub Secrets'tan al
          REPLICATE_API_TOKEN: ${{ secrets.REPLICATE_API_TOKEN }}
          # Diğer API key'ler...
      
      - name: Deploy
        run: echo "Deploy to your hosting service here"
        # Vercel, Netlify, veya kendi sunucunuz için deploy komutları
```

### B. GitHub Secrets Ekleme

1. GitHub repository'nizde **Settings** > **Secrets and variables** > **Actions**'a gidin
2. **New repository secret** butonuna tıklayın
3. Gerekli API key'leri ekleyin:
   - `REPLICATE_API_TOKEN`
   - `ELEVENLABS_API_KEY`
   - `GOOGLE_TTS_API_KEY`
   - `AZURE_SPEECH_KEY`
   - `HUGGINGFACE_API_KEY`
   - vb.

## 4. Günlük Kullanım - Değişiklikleri Push Etme

Her değişiklikten sonra:

```bash
# Değişiklikleri kontrol et
git status

# Değişiklikleri ekle
git add .

# Commit yap
git commit -m "Açıklayıcı commit mesajı"

# GitHub'a push et
git push origin main
```

## 5. Otomatik Sync (Opsiyonel)

### A. Git Hooks ile Otomatik Push

`.git/hooks/post-commit` dosyası oluşturun:

```bash
#!/bin/sh
git push origin main
```

Dosyayı çalıştırılabilir yapın:
```bash
chmod +x .git/hooks/post-commit
```

### B. Watch Script (Geliştirme için)

`package.json`'a ekleyin:

```json
{
  "scripts": {
    "watch": "nodemon --watch . --ext ts,tsx,js,jsx --exec 'git add . && git commit -m \"Auto commit\" && git push'"
  }
}
```

## 6. Vercel/Netlify ile Otomatik Deploy

### Vercel:
1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Environment variables'ları ekleyin
4. Her push'ta otomatik deploy olur

### Netlify:
1. [Netlify](https://netlify.com) hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Environment variables'ları ekleyin

## 7. Gitignore Kontrolü

`.gitignore` dosyanızda şunlar olmalı:
- `.env` ve `.env*.local` (API key'ler)
- `node_modules/`
- `.next/`
- `out/`
- `.DS_Store`

## Hızlı Başlangıç Komutları

```bash
# İlk kurulum (bir kez)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main

# Günlük kullanım
git add .
git commit -m "Update: açıklama"
git push
```

## Sorun Giderme

**"remote origin already exists" hatası:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

**"Permission denied" hatası:**
- GitHub'da Personal Access Token kullanın
- SSH key'lerinizi kontrol edin

**"Large files" hatası:**
- `.gitignore`'a büyük dosyaları ekleyin
- Git LFS kullanın (büyük dosyalar için)

