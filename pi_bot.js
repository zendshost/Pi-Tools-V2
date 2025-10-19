// pi_bot.js

const StellarSdk = require('stellar-sdk');
const bip39 = require('bip39');
const edHd = require('ed25519-hd-key');
const fs = require('fs');

// --- Konfigurasi Jaringan Pi ---
const PI_NETWORK_PASSPHRASE = "Pi Network";
const PI_HORIZON_URL = "https://api.mainnet.minepi.com";
const server = new StellarSdk.Server(PI_HORIZON_URL, { allowHttp: true });

// --- Konfigurasi Transaksi (Dapat Diubah) ---
const CUSTOM_FEE = '100000'; // Biaya transaksi 0.01 Pi
const FEE_IN_PI = 0.01;
const BASE_RESERVE_PI = 1.0; // Saldo minimum yang WAJIB ada di dompet Pi
const DELAY_BETWEEN_SWEEP_MS = 2000; // Jeda waktu 2 detik antara transaksi sweep

// Fungsi helper untuk jeda waktu
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ==========================================================
 * PERINGATAN KEAMANAN (SECURITY WARNING)
 * ==========================================================
 * Skrip ini menangani kunci rahasia (secret key) dan frasa mnemonik.
 * Pastikan Anda menjalankan skrip ini di lingkungan yang aman.
 * File output seperti 'secret.txt' dan 'restored_wallets.csv' SANGAT SENSITIF.
 * ==========================================================
 */


// --- FUNGSI-FUNGSI MANAJEMEN DOMPET ---

function mnemonicToStellarKeypair(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const { key } = edHd.derivePath("m/44'/314159'/0'", seed);
  return StellarSdk.Keypair.fromRawEd25519Seed(key);
}

function generateWallet() {
  console.log("Membuat dompet Pi baru...");
  try {
    const mnemonic = bip39.generateMnemonic(256);
    const keypair = mnemonicToStellarKeypair(mnemonic);
    const wallet = { mnemonic, publicKey: keypair.publicKey(), secretKey: keypair.secret() };
    console.log("✅ Dompet berhasil dibuat!");
    saveWalletToFile(wallet);
    fs.writeFileSync('secret.txt', wallet.secretKey);
    console.log("🔑 Secret key juga disimpan ke file: secret.txt");
    return wallet;
  } catch (error) {
    console.error("❌ Gagal membuat dompet:", error.message);
    throw error;
  }
}

function restoreWalletFromMnemonic(mnemonic) {
  console.log("Memulihkan dompet dari mnemonik...");
  const trimmedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');
  if (!bip39.validateMnemonic(trimmedMnemonic)) {
      console.warn("⚠️ Peringatan: Frasa mnemonik tidak lolos validasi standar BIP39, namun proses tetap dilanjutkan.");
  }
  try {
    const keypair = mnemonicToStellarKeypair(trimmedMnemonic); 
    const wallet = { mnemonic: trimmedMnemonic, publicKey: keypair.publicKey(), secretKey: keypair.secret() };
    console.log("✅ Dompet berhasil dipulihkan.");
    saveWalletToFile(wallet);
    fs.writeFileSync('secret.txt', wallet.secretKey);
    console.log("🔑 Secret key berhasil disimpan ke file: secret.txt");
    return keypair;
  } catch (error) {
    console.error("❌ Gagal memulihkan dompet:", error.message);
    throw error;
  }
}

async function restoreBatchFromMnemonicFile(filePath) {
    console.log(`⚙️  Memulai proses pemulihan massal dari file: ${filePath}`);
    try {
        const mnemonics = fs.readFileSync(filePath, 'utf-8').split('\n').filter(line => line.trim() !== '');
        if (mnemonics.length === 0) { console.error("❌ File tidak berisi frasa mnemonik yang valid."); return; }
        console.log(`🔎  Ditemukan ${mnemonics.length} frasa mnemonik untuk diproses.`);
        const restoredWallets = [];
        let successCounter = 0;
        for (let i = 0; i < mnemonics.length; i++) {
            const mnemonic = mnemonics[i].trim().replace(/\s+/g, ' ');
            if ((i + 1) % 50 === 0 || i === mnemonics.length - 1 || i === 0) {
                console.log(`   -> Memproses dompet ${i + 1}/${mnemonics.length}...`);
            }
            try {
                const keypair = mnemonicToStellarKeypair(mnemonic);
                restoredWallets.push({ mnemonic: `"${mnemonic}"`, publicKey: keypair.publicKey(), secretKey: keypair.secret() });
                successCounter++;
            } catch (e) {
                console.warn(`   ⚠️ Gagal memproses baris ${i + 1}. Pastikan berisi 24 kata.`);
            }
        }
        if (restoredWallets.length > 0) {
            const outputCsvFile = 'restored_wallets.csv';
            const csvHeader = 'Mnemonic,PublicKey,SecretKey\n';
            const csvRows = restoredWallets.map(w => `${w.mnemonic},${w.publicKey},${w.secretKey}`).join('\n');
            fs.writeFileSync(outputCsvFile, csvHeader + csvRows);
            const outputSecretFile = 'SecretKey.txt';
            const secretKeysOnly = restoredWallets.map(w => w.secretKey).join('\n');
            fs.writeFileSync(outputSecretFile, secretKeysOnly);
            console.log(`\n✅ Selesai! ${successCounter} dompet berhasil dipulihkan.`);
            console.log(`📄 Hasil lengkap disimpan dalam file: ${outputCsvFile}`);
            console.log(`🔑 Daftar Secret Key untuk 'sweep' disimpan di: ${outputSecretFile}`);
        } else {
            console.error("❌ Tidak ada dompet yang berhasil dipulihkan.");
        }
    } catch (error) {
        console.error("❌ Terjadi kesalahan saat pemulihan massal:", error.message);
    }
}


// --- FUNGSI-FUNGSI TRANSAKSI ---

async function sweepAllWallets(secretKeyFilePath, destinationPublicKey) {
    console.log(`\n⚙️  Memulai proses 'sweep' dari file: ${secretKeyFilePath}`);
    console.log(`🎯  Alamat Tujuan: ${destinationPublicKey}`);
    
    let successCount = 0, skippedCount = 0, totalSwept = 0;
    const MINIMUM_BALANCE_TO_SWEEP = BASE_RESERVE_PI + FEE_IN_PI;

    try {
        const secretKeys = fs.readFileSync(secretKeyFilePath, 'utf-8').split('\n').filter(line => line.trim().startsWith('S'));
        if (secretKeys.length === 0) { console.error("❌ File tidak berisi secret key yang valid."); return; }
        console.log(`🔎  Ditemukan ${secretKeys.length} secret key untuk diproses.\n`);

        for (let i = 0; i < secretKeys.length; i++) {
            const secretKey = secretKeys[i].trim();
            if (!secretKey) continue;
            
            const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
            const publicKey = sourceKeypair.publicKey();
            console.log(`--- Dompet ${i + 1}/${secretKeys.length} (${publicKey.slice(0, 8)}...) ---`);

            try {
                const account = await server.loadAccount(publicKey);
                const piBalanceEntry = account.balances.find(b => b.asset_type === 'native');
                
                if (!piBalanceEntry) { console.log("   🟡  Tidak ada saldo Pi. Dilewati."); skippedCount++; await sleep(200); continue; }

                const balance = parseFloat(piBalanceEntry.balance);
                console.log(`   Saldo ditemukan: ${balance.toFixed(7)} Pi`);

                // Logika pengecekan saldo yang benar, memperhitungkan saldo minimum 1 Pi
                if (balance <= MINIMUM_BALANCE_TO_SWEEP) { 
                    console.log(`   Saldo tidak cukup untuk mengirim (harus > ${MINIMUM_BALANCE_TO_SWEEP} Pi). Dilewati.`); 
                    skippedCount++; 
                    await sleep(200); continue; 
                }

                // Logika perhitungan jumlah kirim yang benar
                const amountToSend = (balance - BASE_RESERVE_PI - FEE_IN_PI).toFixed(7);
                console.log(`   Mempersiapkan pengiriman: ${amountToSend} Pi...`);

                const tx = new StellarSdk.TransactionBuilder(account, { fee: CUSTOM_FEE, networkPassphrase: PI_NETWORK_PASSPHRASE })
                    .addOperation(StellarSdk.Operation.payment({ destination: destinationPublicKey, asset: StellarSdk.Asset.native(), amount: amountToSend }))
                    .setTimeout(180).build();
                
                tx.sign(sourceKeypair);
                const result = await server.submitTransaction(tx);
                
                if (result && result.hash) {
                    console.log(`   ✅  Berhasil dikirim! Hash: ${result.hash.slice(0,20)}...`);
                    successCount++;
                    totalSwept += parseFloat(amountToSend);
                } else {
                    console.log(`   ⚠️  Transaksi GAGAL atau diabaikan server.`);
                    console.log('   -> Respons mentah:', JSON.stringify(result, null, 2));
                    skippedCount++;
                }
            } catch (error) {
                const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
                console.error(`   ❌  Gagal: ${errorDetails.substring(0, 200)}`);
                skippedCount++;
            }
            console.log(`   ...menunggu ${DELAY_BETWEEN_SWEEP_MS / 1000} detik sebelum melanjutkan...`);
            await sleep(DELAY_BETWEEN_SWEEP_MS); 
        }
        
        console.log("\n--- RINGKASAN PROSES SWEEP ---");
        console.log(`✅  Transaksi Berhasil: ${successCount}`);
        console.log(`🟡  Dompet Dilewati/Gagal: ${skippedCount}`);
        console.log(`💸  Total Pi Terkirim: ${totalSwept.toFixed(7)} Pi`);
        console.log("🏁  Proses selesai.");
    } catch (error) {
        console.error("❌ Terjadi kesalahan fatal saat proses sweep:", error.message);
    }
}

async function sendPayment(secretKey, destination, amount, memo) {
  // Fungsi ini tetap sama, untuk mengirim sejumlah tertentu
  console.log(`💸 Mempersiapkan pengiriman ${amount} Pi ke ${destination}...`);
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, { fee: CUSTOM_FEE, networkPassphrase: PI_NETWORK_PASSPHRASE })
      .addOperation(StellarSdk.Operation.payment({ destination, asset: StellarSdk.Asset.native(), amount }))
      .setTimeout(180);
    if (memo) { tx.addMemo(StellarSdk.Memo.text(memo)); }
    const builtTransaction = tx.build();
    builtTransaction.sign(sourceKeypair);
    const result = await server.submitTransaction(builtTransaction);
    if (result && result.hash) {
      console.log("✅ Transaksi berhasil dikirim! Hash:", result.hash);
    } else {
      console.warn("⚠️ Transaksi kemungkinan berhasil, tetapi hash tidak diterima.");
    }
  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`❌ Pengiriman gagal: ${errorDetails}`);
  }
}


// --- FUNGSI-FUNGSI PEMBANTU ---

function saveWalletToFile(walletData) {
    const filename = `pi-wallet-${walletData.publicKey.slice(0, 8)}-${Date.now()}.json`;
    const dataToSave = {
        note: "SIMPAN FILE INI DENGAN AMAN.", ...walletData, createdAt: new Date().toISOString()
    };
    fs.writeFileSync(filename, JSON.stringify(dataToSave, null, 2));
    console.log(`💾 Detail dompet (JSON) tersimpan di: ${filename}`);
}

async function checkBalance(publicKey) {
    console.log(`🔍 Memeriksa saldo untuk akun: ${publicKey}`);
    try {
      const account = await server.loadAccount(publicKey);
      console.log("\n--- Informasi Akun ---");
      console.log(`Alamat: ${account.account_id}`);
      account.balances.forEach(balance => {
        if (balance.asset_type === 'native') {
          console.log(`  Pi: ${parseFloat(balance.balance).toLocaleString('en-US', { minimumFractionDigits: 7 })} Pi`);
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error("❌ Akun belum aktif (saldo 0).");
      } else {
        console.error("❌ Gagal memeriksa saldo:", error.message);
      }
    }
}


// --- KONTROLER UTAMA (MAIN) ---

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command) {
      console.log("\n--- Pi Network Bot ---");
      console.log(getHelpMenu());
      return;
  }
  console.log("\n--- Pi Network Bot ---");
  
  switch (command) {
    case 'generate':
      const wallet = generateWallet();
      console.log("\n--- HASIL PEMBUATAN DOMPET ---");
      console.log("Frasa Mnemonik:", wallet.mnemonic);
      console.log("Public Key:", wallet.publicKey);
      console.log("Secret Key:", wallet.secretKey);
      break;

    case 'restore':
      const restoreSource = args[1];
      if (!restoreSource) { console.log(getHelpMenu()); return; }
      let mnemonic;
      try {
        if (fs.existsSync(restoreSource)) {
          console.log(`Membaca mnemonik dari file: ${restoreSource}`);
          mnemonic = fs.readFileSync(restoreSource, 'utf-8');
        } else {
          mnemonic = args.slice(1).join(' ');
        }
        const keypair = restoreWalletFromMnemonic(mnemonic);
        console.log("\n--- HASIL PEMULIHAN DOMPET ---");
        console.log("Public Key:", keypair.publicKey());
        console.log("Secret Key:", keypair.secret());
      } catch (e) {
        console.error(`❌ Error: ${e.message}`);
      }
      break;
    
    case 'restore-batch':
        const batchFile = args[1];
        if (!batchFile) { console.log(getHelpMenu()); return; }
        if (!fs.existsSync(batchFile)) { console.error(`❌ File tidak ditemukan: ${batchFile}`); return; }
        await restoreBatchFromMnemonicFile(batchFile);
        break;
    
    case 'sweep-all':
        const [secretFile, destination] = args.slice(1);
        if (!secretFile || !destination) { console.log(getHelpMenu()); return; }
        if (!fs.existsSync(secretFile)) { console.error(`❌ File tidak ditemukan: ${secretFile}`); return; }
        await sweepAllWallets(secretFile, destination);
        break;

    case 'balance':
      const publicKeyForBalance = args[1];
      if (!publicKeyForBalance) { console.log(getHelpMenu()); return; }
      await checkBalance(publicKeyForBalance);
      break;

    case 'send':
      const [secretKey, dest, amount, ...memoParts] = args.slice(1);
      if (!secretKey || !dest || !amount) { console.log(getHelpMenu()); return; }
      await sendPayment(secretKey, dest, amount, memoParts.join(' '));
      break;

    case 'sendfromfile':
      const [skFile, sendDest, sendAmt, ...sendMemoPts] = args.slice(1);
      if (!skFile || !sendDest || !sendAmt) { console.log(getHelpMenu()); return; }
      try {
          const sk = fs.readFileSync(skFile, 'utf-8').trim();
          await sendPayment(sk, sendDest, sendAmt, sendMemoPts.join(' '));
      } catch (e) {
          console.error(`❌ Gagal: ${e.message}`);
      }
      break;

    default:
      console.log(`Perintah tidak dikenal: ${command}`);
      console.log(getHelpMenu());
  }
}

function getHelpMenu() {
    return `
Gunakan salah satu dari perintah berikut:

--- Manajemen Dompet ---
  generate
    Membuat dompet baru dan file secret.txt.

  restore <24 kata | path/ke/phrase.txt>
    Memulihkan 1 dompet dan membuat file secret.txt.

  restore-batch <path/ke/file_phrase.txt>
    Memulihkan BANYAK dompet dari file. Hasilnya disimpan
    di 'restored_wallets.csv' (lengkap) dan 'SecretKey.txt' (siap pakai).

--- Transaksi ---
  send <secret_key> <tujuan> <jumlah> [memo]
    Mengirim Pi dengan mengetik sejumlah tertentu.

  sendfromfile <path/ke/secret.txt> <tujuan> <jumlah> [memo]
    Sama seperti 'send', tapi membaca secret key dari file.

  sweep-all <path/ke/SecretKey.txt> <tujuan>
    Mengirim SEMUA saldo yang tersedia (di atas 1 Pi) 
    dari BANYAK dompet ke satu tujuan.

--- Informasi ---
  balance <public_key>
    Memeriksa saldo sebuah dompet.
`;
}

main().catch(() => {});
