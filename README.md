

### Documentasi

Ini adalah **Bot Otomatisasi Pi Network**, sebuah program yang dijalankan melalui baris perintah (terminal/CMD) untuk mengelola banyak dompet Pi Network sekaligus. Alat ini sangat berguna jika Anda memiliki puluhan, ratusan, atau bahkan ribuan dompet dan ingin melakukan tugas seperti:

-   Memulihkan semua dompet dari daftar frasa sandi (mnemonic).
-   Mengumpulkan (menyapu/sweep) semua koin Pi dari banyak dompet ke satu dompet utama.
-   Memeriksa saldo dan mengirim transaksi secara terprogram.


### 🚨 **PERINGATAN UTAMA (SANGAT PENTING!)** 🚨

Sebelum Anda melanjutkan, pahami risikonya:

1.  **Keamanan Data:** Alat ini akan meminta dan menyimpan **frasa mnemonik** dan **secret key** Anda dalam file di komputer Anda (`phrase.txt`, `SecretKey.txt`, `restored_wallets.csv`). File-file ini adalah kunci utama ke seluruh dana Pi Anda.
2.  **Jangan Bagikan File Apapun:** Siapapun yang memiliki akses ke file-file tersebut dapat **MENGURAS HABIS** semua koin Pi Anda.
3.  **Gunakan di Komputer Aman:** Pastikan komputer Anda bebas dari virus, malware, atau keylogger. Jangan pernah menjalankannya di komputer umum atau yang tidak Anda percayai.
4.  **Risiko Ditanggung Sendiri:** Pengembang dan saya (sebagai AI) tidak bertanggung jawab jika terjadi kehilangan dana. **Gunakan dengan sangat hati-hati.**

---

### Panduan Lengkap: Cara Instalasi dan Penggunaan

Berikut adalah langkah-langkah dari awal hingga akhir untuk menggunakan alat ini.

#### Langkah 1: Instalasi

Anda perlu menyiapkan *tool* ini di komputer Anda terlebih dahulu.

1.  **Buka Terminal atau Command Prompt (CMD).**
    -   Di Windows, cari "Command Prompt" atau "PowerShell".
    -   Di macOS atau Linux, cari "Terminal".

2.  **Clone Repositori dari GitHub.**
    Jalankan perintah yang Anda berikan untuk mengunduh semua file dari repositori.
    ```bash
    git clone https://github.com/zendshost/Pi-Tools-V2.git
    ```

3.  **Masuk ke Folder Proyek.**
    Setelah selesai mengunduh, masuk ke folder yang baru dibuat.
    ```bash
    cd Pi-Tools-V2
    ```

4.  **Instal Dependensi yang Diperlukan.**
    Alat ini memerlukan beberapa paket Node.js agar bisa berjalan. Perintah ini akan mengunduh dan menginstalnya secara otomatis.
    ```bash
    npm install
    ```
    Tunggu hingga proses selesai. Jika tidak ada error, alat Anda sudah siap digunakan.

#### Langkah 2: Contoh Penggunaan Utama (Mengumpulkan Dana dari Banyak Dompet)

Ini adalah alur kerja yang paling umum, yaitu memulihkan banyak dompet dan mengirim semua koinnya ke satu dompet utama.

1.  **Buat File `phrase.txt`**
    -   Di dalam folder `Pi-Tools-V2`, buat sebuah file baru bernama `phrase.txt`.
    -   Isi file ini dengan semua frasa mnemonik (24 kata) dari dompet-dompet yang ingin Anda pulihkan.
    -   **Penting:** Setiap frasa harus berada di baris baru.
    -   Contoh isi `phrase.txt`:
        ```
        word1 word2 word3 ... word24
        another1 another2 another3 ... another24
        yetanother1 yetanother2 yetanother3 ... yetanother24
        ```

2.  **Jalankan Proses Pemulihan Batch (`restore-batch`)**
    -   Kembali ke terminal Anda (yang masih berada di dalam folder `Pi-Tools-V2`).
    -   Jalankan perintah berikut:
        ```bash
        node pi_bot.js restore-batch phrase.txt
        ```
    -   Alat ini akan membaca setiap baris di `phrase.txt`, memulihkan dompetnya, dan membuat dua file baru:
        -   `restored_wallets.csv`: Berisi tabel lengkap (Mnemonic, Public Key, Secret Key). **SIMPAN FILE INI DENGAN SANGAT AMAN!**
        -   `SecretKey.txt`: Berisi daftar *secret key* saja. File ini akan kita gunakan di langkah berikutnya.

3.  **Jalankan Proses Pengumpulan Dana (`sweep-all`)**
    -   Sekarang Anda akan menggunakan file `SecretKey.txt` untuk mengirim semua saldo dari dompet-dompet tersebut ke dompet utama Anda.
    -   Siapkan alamat dompet utama Anda (yang dimulai dengan huruf `G`).
    -   Jalankan perintah berikut, ganti `G...ALAMAT_UTAMA_ANDA` dengan alamat dompet Anda yang sebenarnya:
        ```bash
        node pi_bot.js sweep-all SecretKey.txt G...ALAMAT_UTAMA_ANDA
        ```
    -   **Contoh:**
        ```bash
        node pi_bot.js sweep-all SecretKey.txt GBYP2GVPYAS2Y6FWB5PALY4A4ER34L2HYK2JBUT2B3T5T3F4V5U6X7Y8
        ```
    -   Bot akan mulai memproses setiap *secret key* satu per satu, memeriksa saldo, dan mengirimkannya ke alamat tujuan Anda. Proses ini mungkin memakan waktu lama jika Anda memiliki banyak dompet, jadi biarkan saja berjalan.

### Daftar Semua Perintah (Sebagai Referensi)

-   **Membuat dompet baru:**
    `node pi_bot.js generate`

-   **Memulihkan 1 dompet (frasa diketik langsung):**
    `node pi_bot.js restore kata1 kata2 kata3 ...`

-   **Memeriksa saldo:**
    `node pi_bot.js balance G...ALAMAT_PUBLIK`

-   **Mengirim Pi dari 1 dompet (secret key diketik):**
    `node pi_bot.js send S...SECRET_KEY G...ALAMAT_TUJUAN JUMLAH`

---

### ✍️ Kontak Developer

Dibuat dan dikelola oleh **zendshost**.

Jika Anda memiliki pertanyaan, saran, atau menemukan bug, jangan ragu untuk menghubungi melalui:

-   **Telegram:** [@zendshost](https://t.me/zendshost)

### 📜 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini.
