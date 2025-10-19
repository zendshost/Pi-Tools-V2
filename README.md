---

# Pi Network Automation Bot

Sebuah *tool* baris perintah (CLI) yang dibuat dengan Node.js untuk mengotomatiskan berbagai tugas di blockchain Pi Network. Alat ini dirancang untuk membantu pengguna mengelola banyak dompet, memulihkan dari frasa mnemonik, dan mengkonsolidasikan dana secara efisien.

🚨 **PERINGATAN KEAMANAN YANG SANGAT PENTING** 🚨
> Skrip ini menangani data yang sangat sensitif, termasuk **frasa mnemonik** dan **secret key**.
> - **JANGAN PERNAH** membagikan file `phrase.txt`, `SecretKey.txt`, atau `restored_wallets.csv` kepada siapapun.
> - **JANGAN PERNAH** menjalankan skrip ini di komputer yang tidak Anda percayai atau di lingkungan publik.
> - **GUNAKAN DENGAN RISIKO ANDA SENDIRI.** Penulis tidak bertanggung jawab atas kehilangan dana apa pun.

---

## ✨ Fitur Utama

-   **Generate Wallet**: Membuat dompet Pi baru.
-   **Restore Wallet**: Memulihkan satu dompet dari frasa mnemonik.
-   **Batch Restore**: Memulihkan **ratusan atau ribuan** dompet dari satu file dan menyimpannya dalam format CSV.
-   **Sweep All Wallets**: Mengumpulkan **semua saldo yang tersedia** (di atas 1 Pi) dari banyak dompet ke satu alamat tujuan.
-   **Send Payment**: Mengirim sejumlah Pi tertentu dari satu dompet.
-   **Check Balance**: Memeriksa saldo sebuah alamat dompet.

## 🛠️ Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:
-   [Node.js](https://nodejs.org/) (versi 16 atau lebih baru direkomendasikan)
-   npm (biasanya terinstal bersama Node.js)

## 🚀 Instalasi

1.  **Siapkan Folder Proyek:**
    Buat folder baru untuk proyek ini (misalnya, `pi-automation`) dan masuk ke dalamnya melalui terminal.

2.  **Simpan File Skrip:**
    Simpan kode bot sebagai `pi_bot.js` di dalam folder yang baru Anda buat.

3.  **Instal Dependensi:**
    Buka terminal di dalam folder proyek Anda dan jalankan perintah berikut:
    ```bash
    npm install
    ```
    Anda hanya perlu melakukan ini sekali. Setelah selesai, Anda siap untuk menggunakan skrip.

---

## 📖 Panduan Penggunaan (Command Reference)

Semua perintah dijalankan dari terminal dengan format: `node pi_bot.js <perintah> [argumen]`

### ⚙️ Manajemen Dompet

#### `generate`
Membuat dompet Pi baru dan secara otomatis menyimpan `secret.txt` untuk penggunaan cepat.
-   **Syntax:** `node pi_bot.js generate`

#### `restore <frasa | file.txt>`
Memulihkan satu dompet dari frasa mnemonik yang diketik langsung atau dari sebuah file.
-   **Syntax (ketik langsung):** `node pi_bot.js restore kata1 kata2 kata3 ...`
-   **Syntax (dari file):** `node pi_bot.js restore phrase.txt`

#### `restore-batch <file_phrase.txt>`
Memulihkan banyak dompet dari file yang berisi satu frasa per baris. Ini adalah perintah yang paling kuat untuk memulai.
-   **Syntax:** `node pi_bot.js restore-batch phrase.txt`
-   **Output:** Menghasilkan dua file:
    1.  `restored_wallets.csv`: Arsip lengkap (Mnemonic, Public Key, Secret Key). **SIMPAN DENGAN AMAN!**
    2.  `SecretKey.txt`: Daftar Secret Key yang siap digunakan untuk perintah `sweep-all`.

### 💸 Transaksi

#### `sweep-all <file_secretkey.txt> <alamat_tujuan>`
Mengumpulkan semua saldo yang dapat dikirim (total saldo dikurangi 1.01 Pi) dari semua dompet yang tercantum di file `SecretKey.txt` ke satu alamat tujuan.
-   **Syntax:** `node pi_bot.js sweep-all SecretKey.txt GABCD...XYZ`

#### `sendfromfile <file_secret.txt> <tujuan> <jumlah> [memo]`
Mengirim sejumlah Pi tertentu dari satu dompet, dengan membaca secret key dari file.
-   **Syntax:** `node pi_bot.js sendfromfile secret.txt GABCD...XYZ 10.5 "Donasi untuk proyek"`

#### `send <secret_key> <tujuan> <jumlah> [memo]`
Sama seperti `sendfromfile`, tetapi Anda mengetik secret key langsung di terminal.
-   **Syntax:** `node pi_bot.js send SABC...XYZ GABCD...XYZ 25`

### ℹ️ Informasi

#### `balance <alamat_publik>`
Memeriksa saldo Pi dari sebuah alamat publik.
-   **Syntax:** `node pi_bot.js balance GABCD...XYZ`

---

##  workflows/ Contoh Alur Kerja Utama

Berikut adalah cara paling umum untuk menggunakan alat ini untuk mengkonsolidasikan dana dari banyak dompet.

**Tujuan:** Memulihkan 1000 dompet dari frasa dan mengirim semua Pi ke dompet utama.

1.  **Siapkan `phrase.txt`**
    Buat file `phrase.txt` dan isi dengan 1000 frasa mnemonik Anda, masing-masing di baris baru.

2.  **Jalankan `restore-batch`**
    ```bash
    node pi_bot.js restore-batch phrase.txt
    ```
    Tunggu hingga proses selesai. Sekarang Anda memiliki file `SecretKey.txt` yang berisi 1000 secret key.

3.  **Jalankan `sweep-all`**
    Gunakan file `SecretKey.txt` yang baru dibuat sebagai input untuk mengirim semua dana ke dompet utama Anda.
    ```bash
    # Ganti G... dengan alamat dompet utama Anda
    node pi_bot.js sweep-all SecretKey.txt GYOURMAINWALLETADDRESS...
    ```
    Skrip akan memproses setiap dompet satu per satu dengan jeda waktu untuk menghindari pembatasan dari server. Biarkan proses berjalan hingga selesai.

## 📄 Deskripsi File Penting

-   `phrase.txt` (Input Pengguna): File yang Anda buat, berisi daftar frasa mnemonik, satu per baris.
-   `SecretKey.txt` (Output / Input): Dihasilkan oleh `restore-batch` dan digunakan oleh `sweep-all`. Berisi daftar secret key.
-   `restored_wallets.csv` (Output): Dihasilkan oleh `restore-batch`. Ini adalah arsip utama Anda yang menghubungkan setiap mnemonic dengan kunci-kuncinya. **JAGA KERAHASIAANNYA!**

## 📜 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini.
