# Design Document: Lapor Pak! Streaming — Android TV Application (.apk)

**Date:** 2026-10-29  
**Status:** Approved Draft for Final Review  
**Target Repository:** `lapor-pak-streaming-tv` (Dedicated Android TV Repository)  

---

## 1. Intent & Purpose

Pengguna memiliki aplikasi web streaming Lapor Pak! (versi V2) yang telah di-deploy di hosting InfinityFree (`https://laporpak.my.to/`) dengan database 167+ episode dan pemutar video yang mengambil tautan streaming MP4 dari CDN Facebook. 

Tujuan dari proyek ini adalah membangun aplikasi **Android TV (.apk)** khusus layar televisi (10-foot UI) yang:
- Memiliki tampilan, tema, dan estetika yang selaras dengan versi web (tema gelap elegan, aksen kuning emas, hero spotlight, dan deretan episode bulanan).
- Mengimplementasikan navigasi penuh dengan **Remote Control Android TV (D-Pad)** tanpa memerlukan kursor mouse.
- Memiliki alur rilis modern **GitHub Actions CI/CD** sehingga APK Android TV dapat dikompilasi secara otomatis di cloud GitHub tanpa memerlukan instalasi Android Studio lokal.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
1. **Dedicated Android TV APK:** Menghasilkan file APK siap pasang (`.apk`) yang dapat langsung diinstal pada Android TV, Google TV, dan Android TV Box (resolusi standar 1080p/4K 16:9).
2. **Navigasi Remote D-Pad (10-Foot UI):** 
   - Kontrol 100% menggunakan tombol Arah (Atas, Bawah, Kiri, Kanan), tombol OK/Enter, dan tombol Kembali (Back).
   - Status fokus visual yang tegas (kartu episode yang disorot membesar dengan border kuning menyala / glow).
   - Scroll baris horizontal (*rails/carousels*) untuk kategori dan riwayat tontonan.
3. **Player Khusus TV:**
   - Pemutaran video layar penuh otomatis saat episode dipilih.
   - Pintasan remote instan: tombol OK untuk Play/Pause, tombol Kiri/Kanan untuk melompat (seek) 10 detik, tombol Kembali untuk keluar dari pemutar.
   - OSD (On-Screen Display) kontrol yang otomatis menghilang setelah 3 detik hening.
4. **Auto-Login Transparan (Zero-Friction TV Experience):**
   - Aplikasi otomatis melakukan login latar belakang (silent auto-login) menggunakan kredensial terkonfigurasi saat splash screen. Pengguna di ruang keluarga tidak perlu mengetik username/password menggunakan remote TV.
5. **Penanganan Firewall InfinityFree Transparan:**
   - Menyelesaikan tantangan bot firewall InfinityFree (`aes.js` / cookie `__test`) melalui inisialisasi WebView native sebelum request data pertama dijalankan.
6. **Automated Cloud Build (GitHub Actions CI/CD):**
   - Alur kerja CI/CD (`.github/workflows/build-apk.yml`) yang otomatis mengompilasi APK setiap kali ada push atau tag rilis.
   - APK yang dihasilkan otomatis ditandatangani (*auto-signed*) dan diunggah ke *GitHub Releases* atau *Actions Artifacts* untuk langsung diunduh ke TV.

### Non-Goals
- **Fitur Admin di TV:** Manajemen tambah/hapus episode atau pengelolaan database tidak disediakan di aplikasi TV (tetap dilakukan melalui web dashboard admin).
- **Layar Login Manual di TV:** Tidak menggunakan input teks virtual di layar TV karena auto-login sudah diterapkan.
- **Mode Portrait / HP:** Aplikasi dikunci khusus mode lanskap (landscape 16:9 TV).
- **Fitur Download Offline:** Video langsung di-stream dari CDN Facebook.

### Anti-Goals
- **Tidak Memerlukan Kursor Mouse Virtual:** Aplikasi tidak boleh mengandalkan kursor mouse atau sentuhan (touch). Semua aksi harus dapat dijangkau oleh D-Pad.
- **Tidak Bergantung pada Android Studio Lokal:** Seluruh proses kompilasi binary APK dilakukan di GitHub Actions, menghemat waktu dan penyimpanan komputer lokal.

---

## 3. Technology Stack & Architecture

### A. Frontend TV: React 19 + Vite + Tailwind CSS + Spatial Navigation
- **Alasan:** Memanfaatkan kembali komponen UI, styling, dan tipe data dari `lapor-pak-streaming-v2` sehingga identitas visual 100% identik dan konsisten.
- **Sistem Navigasi TV:** Menggunakan engine navigasi berbasis D-Pad keydown (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape/Backspace`) dengan visual indicator focus.
- **Komponen Utama:**
  - `TvNavbar`: Navigasi atas ringkas (Beranda, Playlist, Riwayat).
  - `TvHeroSpotlight`: Banner episode terbaru/pilihan dengan preview sinopsis dan tombol Putar Cepat.
  - `TvRowRail`: Baris horizontal kartu episode dengan animasi fokus scale-up.
  - `TvPlayer`: Pemutar video terintegrasi dengan kontrol remote TV.

### B. Mobile/TV Runtime: Capacitor (Android Platform)
- **Alasan:** Capacitor membungkus web app ke dalam project Android native resmi (Gradle), mendukung konfigurasi Android TV (`android:banner`, leanback intent, hardware acceleration), dan menjalankan WebView Chrome modern yang otomatis menangani cookie firewall InfinityFree.
- **Konfigurasi Android TV (`AndroidManifest.xml`):**
  - `<uses-feature android:name="android.software.leanback" android:required="false" />`
  - `<uses-feature android:name="android.hardware.touchscreen" android:required="false" />`
  - Intent filter `android.intent.category.LEANBACK_LAUNCHER` agar icon aplikasi muncul di halaman utama Android TV.
  - Mode orientasi: `android:screenOrientation="sensorLandscape"`.

### C. Backend & Autentikasi
- **Host Endpoint:** `https://laporpak.my.to/api`
- **Auto-Login:** Saat splash screen muncul, aplikasi mengirim payload login admin yang sudah terkonfigurasi ke `/api/auth/login`. Begitu sesi `PHPSESSID` diterima, aplikasi langsung membuka halaman utama.
- **Bypass Firewall InfinityFree:** Sebelum request data pertama, WebView Android menyelesaikan tantangan `aes.js` sekali di awal, menanamkan cookie `__test` ke `CookieManager`, sehingga semua panggilan API berikutnya lolos tanpa halangan.

### D. CI/CD Pipeline (GitHub Actions)
- File alur kerja: `.github/workflows/build-apk.yml`
- Langkah build:
  1. Checkout source code.
  2. Setup Node.js 20 & install dependensi (`npm ci`).
  3. Build React TV assets (`npm run build`).
  4. Sinkronisasi aset ke platform Android (`npx cap sync android`).
  5. Setup Java 17 & Android SDK.
  6. Eksekusi Gradle: `./gradlew assembleDebug` (auto-signed dengan debug cert yang dapat langsung di-sideload di TV).
  7. Unggah artefak `lapor-pak-tv.apk` ke GitHub Actions & buat GitHub Release otomatis.

---

## 4. UI/UX Specifications (10-Foot Experience)

1. **Skema Warna:**
   - Background Utama: `#080B11` (Deep dark slate)
   - Surface / Card: `#0F172A` / `#1E293B`
   - Warna Aksen / Brand: `#F59E0B` (Amber Gold)
   - Focus State: Border `3px solid #F59E0B` + Box-shadow glow emas + Scale `1.04`
2. **Tipografi Layar TV:**
   - Ukuran font minimal 14px untuk metadata, 20px–28px untuk judul kartu, dan 36px–48px untuk headline hero banner agar terbaca jelas dari jarak 2–3 meter.
3. **Safe Zones:**
   - Padding layar minimal 5% (54px pada 1080p) di sekeliling layar untuk mengantisipasi *overscan* pada TV.

---

## 5. Architectural Calls Made by Builder
Berikut keputusan teknis yang ditetapkan demi efisiensi dan keandalan sistem:
1. **Auto-Login Splash Screen:** Login dijalankan otomatis di background saat boot splash screen, menyimpan kredensial di konfigurasi build aplikasi sehingga pengguna tidak pernah melihat form login di TV.
2. **Tipe Build APK:** GitHub Actions akan memproduksi APK auto-signed siap sideload tanpa mengharuskan pengguna membuat keystore rahasia manual di repository GitHub.
3. **Penyimpanan Kode:** Seluruh struktur kode TV berada di folder ini (`lapor-pak-streaming-tv`), terisolasi penuh dari web v2, siap dihubungkan ke remote Git baru.
