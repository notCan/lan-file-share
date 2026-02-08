# LAN Dosya Paylaşım

Girişli, basit bir LAN dosya paylaşım sunucusu. Bilgisayarınızdaki bir klasörü ağdaki diğer cihazlarla paylaşır; tarayıcıdan listeleyip indirebilirler.

**Sürüm:** 1.0.0

---

## İlk çalıştırmadan önce eklemeniz gerekenler

| Öğe | İşlem |
|-----|--------|
| **`.env`** | **Zorunlu.** `.env.example` dosyasından kopyalayın: `copy .env.example .env` (Windows) veya `cp .env.example .env` (Linux/macOS). Ardından ayarlayın: `LOGIN_USERNAME`, `LOGIN_PASSWORD`; isteğe bağlı: `PORT` (varsayılan 3000), `SHARED_FOLDER` (varsayılan `shared`), üretim için `SESSION_SECRET`. |
| **`shared/`** | Paylaşılacak dosyaların klasörü. Elle oluşturabilir veya ilk çalıştırmada sunucunun oluşturmasını bekleyebilirsiniz. Paylaşmak istediğiniz dosyaları bu klasöre koyun. |
| **`config.json`** | İsteğe bağlı. Repoda örnek var. Farklı klasör yolu kullanacaksanız `sharedFolder` (örn. `"shared"` veya tam yol) yazın. Yoksa sunucu `.env` içindeki `SHARED_FOLDER` veya varsayılan `shared` kullanır. |

**Özet:** `.env.example` dosyasından `.env` oluşturup giriş bilgilerini girin. `shared` klasörünün (veya `config.json` / `.env` ile belirttiğiniz yolun) var olduğundan emin olun; yoksa sunucu ilk çalışmada oluşturabilir.

---

## Gereksinimler

- Node.js 18+

## Kurulum

```bash
npm install
```

`.env.example` dosyasından `.env` oluşturup en az şunları ayarlayın:

- `LOGIN_USERNAME` – giriş kullanıcı adı  
- `LOGIN_PASSWORD` – giriş şifresi  
- İsteğe bağlı: `PORT` (varsayılan 3000), `SHARED_FOLDER` (varsayılan `shared`), `SESSION_SECRET`

**`shared`** klasörünü (veya `config.json` / `SHARED_FOLDER` ile belirttiğiniz yolu) oluşturup paylaşmak istediğiniz dosyaları içine koyun.

## Çalıştırma

| Yöntem | Komut / Dosya |
|--------|----------------|
| Terminal | `npm start` veya `node server.js` |
| Windows (IP + QR) | `start.bat` |

Sunucu `http://0.0.0.0:PORT` üzerinde dinler. Aynı ağdaki cihazlarda `http://BILGISAYAR_IP:PORT` adresini açın. Bat dosyası adresi ve QR kodu konsola yazar.

## İsteğe bağlı: EXE derleme (Windows)

```bash
npm run build
```

Çalıştırılabilir dosya `dist/lan-file-share.exe` içinde oluşur. `dist` klasörünü (içinde `.env`, `config.json` ve `shared` veya seçtiğiniz paylaşım klasörü ile) başka bir bilgisayara kopyalayın. `start-exe.bat` veya exe’yi doğrudan çalıştırın; `.env` ve `config.json` exe ile aynı klasörde olmalıdır.

## İsteğe bağlı: sabit IP (Windows)

- **`set-static-ip.bat`** – Yönetici olarak çalıştırın; mevcut IP’yi sabit yapar (LAN adresinin değişmemesi için).
- **`iptal-static-ip.bat`** – Yönetici olarak çalıştırın; tekrar DHCP’ye döner.

## Proje yapısı

- `server.js` – Express sunucu, giriş, dosya listesi, indirme
- `public/index.html` – Basit dosya tarayıcı arayüzü
- `config.json` – İsteğe bağlı; `sharedFolder` ile varsayılanı değiştirir
- `shared/` – Paylaşılan dosyaların varsayılan klasörü (`.gitignore`’da; `.gitkeep` hariç)
