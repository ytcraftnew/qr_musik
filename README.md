# 🎵 QR Music Player

Pemutar musik otomatis berbasis web yang dapat diakses melalui QR Code. Desain modern, responsif, dan ringan — cukup HTML, CSS, dan JavaScript murni.

## 🚀 Cara Penggunaan

### 1. Tambahkan Musik

Letakkan file MP3 ke folder `music/`:

```
music/
├── lagu1.mp3
├── lagu2.mp3
└── lagu3.mp3
```

### 2. Tambahkan Cover Album

Letakkan gambar cover (format JPG/PNG) ke folder `images/`:

```
images/
├── cover1.jpg
├── cover2.jpg
└── cover3.jpg
```

Ukuran rekomendasi: **300×300px** atau lebih besar (square).

### 3. Daftarkan Lagu di Playlist

Edit file `script.js` dan cari bagian `const playlist = [...]`. Tambahkan lagu baru dengan format:

```javascript
{
    title: "Judul Lagu",
    artist: "Nama Artis",
    src: "music/nama-file.mp3",
    cover: "images/nama-cover.jpg"
}
```

### 4. Generate QR Code

Gunakan layanan seperti:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QR Code Monkey](https://www.qrcode-monkey.com/)

Isi URL dengan alamat website Anda (contoh: `https://namadomain.com`).

### 5. Buka di Browser

Scan QR Code → browser otomatis membuka website → musik langsung diputar! 🎶

## 🎮 Fitur

| Fitur | Keterangan |
|-------|-----------|
| ✅ Autoplay | Otomatis putar saat browser diizinkan |
| ✅ Play/Pause | Putar dan jeda lagu |
| ✅ Next/Previous | Lagu selanjutnya/sebelumnya |
| ✅ Progress Bar | Geser untuk mencari bagian lagu |
| ✅ Volume Control | Atur volume dengan slider |
| ✅ Mute | Tombol bisu |
| ✅ Shuffle | Putar lagu secara acak |
| ✅ Repeat | Ulangi (1 lagu / semua lagu) |
| ✅ Playlist | Pilih lagu dari daftar |
| ✅ Background Blur | Background berubah mengikuti cover lagu |
| ✅ Responsif | Tampilan mobile & desktop |
| ✅ Keyboard Shortcuts | Kontrol dengan keyboard |
| ✅ Animasi Halus | Vinyl berputar, efek transisi |

## ⌨️ Keyboard Shortcuts

| Tombol | Fungsi |
|--------|--------|
| `Spasi` | Play / Pause |
| `←` | Lagu sebelumnya |
| `→` | Lagu selanjutnya |
| `↑` | Volume naik |
| `↓` | Volume turun |
| `M` | Mute / Unmute |
| `S` | Shuffle on/off |
| `R` | Repeat (none → all → one) |

## 📁 Struktur Folder

```
qr-music-player/
├── index.html              # Halaman utama
├── style.css               # Stylesheet
├── script.js               # Logika aplikasi
├── README.md               # Dokumentasi
├── music/                  # Folder MP3
│   ├── lagu1.mp3
│   ├── lagu2.mp3
│   └── lagu3.mp3
└── images/                 # Folder cover
    ├── cover1.jpg
    ├── cover2.jpg
    └── cover3.jpg
```

## 🌐 Browser Support

- Google Chrome (recommended)
- Mozilla Firefox
- Safari
- Microsoft Edge
- Opera

> **Catatan:** Autoplay mungkin diblokir oleh browser tertentu. Jika terjadi, website akan menampilkan tombol "Putar Musik" yang besar.

## 📝 Lisensi

MIT — bebas digunakan dan dimodifikasi.
