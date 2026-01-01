#!/bin/bash

# GitHub Repository Bağlama Scripti
# Kullanım: ./setup-github.sh YOUR_USERNAME REPO_NAME

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Kullanım: ./setup-github.sh YOUR_USERNAME REPO_NAME"
    echo "Örnek: ./setup-github.sh johndoe ai-ugc-video-generator"
    exit 1
fi

USERNAME=$1
REPO_NAME=$2

echo "🚀 GitHub repository bağlama başlatılıyor..."
echo "Repository: https://github.com/$USERNAME/$REPO_NAME"
echo ""

# Git repository'sini başlat
if [ ! -d ".git" ]; then
    echo "📦 Git repository başlatılıyor..."
    git init
else
    echo "✅ Git repository zaten mevcut"
fi

# Remote ekle (varsa kaldır, yoksa ekle)
if git remote get-url origin > /dev/null 2>&1; then
    echo "🔄 Mevcut remote kaldırılıyor..."
    git remote remove origin
fi

echo "🔗 Remote repository ekleniyor..."
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

# Branch'i main yap
echo "🌿 Branch main olarak ayarlanıyor..."
git branch -M main

# Dosyaları ekle
echo "📝 Dosyalar staging area'ya ekleniyor..."
git add .

# İlk commit
echo "💾 İlk commit yapılıyor..."
git commit -m "Initial commit: AI UGC Video Generator" || {
    echo "⚠️  Commit yapılamadı. Değişiklik yok olabilir."
    exit 1
}

# Push yap
echo "⬆️  GitHub'a push ediliyor..."
git push -u origin main || {
    echo "❌ Push başarısız oldu!"
    echo "💡 Şunları kontrol edin:"
    echo "   1. GitHub'da repository oluşturuldu mu?"
    echo "   2. GitHub credentials doğru mu?"
    echo "   3. İnternet bağlantısı var mı?"
    exit 1
}

echo ""
echo "✅ Başarılı! Repository GitHub'a bağlandı."
echo "🔗 Repository URL: https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "📌 Sonraki adımlar:"
echo "   1. GitHub'da Settings > Secrets > Actions'a gidin"
echo "   2. Gerekli API key'leri GitHub Secrets olarak ekleyin"
echo "   3. Değişiklikler için: git add . && git commit -m 'mesaj' && git push"
echo ""

