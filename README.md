# TarımPro Yönetim Paneli

TarımPro; tarım makineleri, müşteriler, siparişler, saha işleri, servis kayıtları, şikayet/talepler ve yapay zeka ajanlarını yöneten React + Node.js + MariaDB uygulamasıdır.

## Teknoloji altyapısı

- Frontend: React, TypeScript, Vite ve `lucide-react`
- Backend: Node.js HTTP server, ES Modules ve `mysql2`
- Veritabanı: MariaDB 10.5+, InnoDB ve `utf8mb4`
- Container: Node.js 20 Alpine tabanlı multi-stage Docker image
- Geliştirme proxy'si: Vite, `/api` isteklerini `localhost:3001` adresine yönlendirir

## Proje yapısı

```text
.
├── src/main.tsx          React uygulaması ve ekranlar
├── src/styles.css        Arayüz stilleri
├── server.mjs            API ve production static file server
├── db.sql                Şema, örnek veriler, view, procedure ve trigger'lar
├── images/               Demo sosyal medya görselleri
├── Dockerfile            Multi-stage production image tanımı
├── docker-compose.yml    Uygulama container konfigürasyonu
├── package.json          npm script ve bağımlılıkları
└── .env.example          Ortam değişkenleri örneği
```

## Gereksinimler

Local geliştirme için Node.js 20+, npm ve MariaDB 10.5+ gerekir. Docker kullanımı için Docker Engine ve Docker Compose gerekir.

## Ortam değişkenleri

`.env.example` dosyasını `.env` adıyla kopyalayın:

```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=tarimpro
DB_USERNAME=root
DB_PASSWORD=root54
```

`server.mjs` bu değerlerle MySQL connection pool oluşturur. `API_PORT` verilmezse API `3001` portunda çalışır. `.env` gizli bilgiler içerebileceğinden Git'e eklenmemelidir.

## npm ile local çalıştırma

Bağımlılıkları yükleyin:

```bash
npm install
```

Veritabanını oluşturup örnek kayıtları yükleyin:

```bash
mariadb -h localhost -P 3306 -u root -p < db.sql
```

Windows'ta MariaDB istemcisi PATH üzerinde değilse MariaDB kurulumundaki `mariadb.exe` veya `mysql.exe` yolunu kullanın.

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Bu komut frontend'i `http://localhost:5173`, API'yi `http://localhost:3001` adresinde çalıştırır. Vite geliştirme proxy'si `/api` çağrılarını Node API'ye gönderir.

Production build ve local server:

```bash
npm run build
node server.mjs
```

Bu kullanımda `dist/` içindeki frontend ve API `http://localhost:3001` üzerinden sunulur.

## Docker ile çalıştırma

### MariaDB ağı ve container'ı

`docker-compose.yml` MariaDB servisini oluşturmuyor; `mariadb` isimli, `app-network` ağına bağlı çalışan bir MariaDB container'ı bekliyor.

```bash
docker network create app-network
docker run -d --name mariadb --network app-network \
  -e MARIADB_ROOT_PASSWORD=root54 \
  -e MARIADB_DATABASE=tarimpro \
  -p 3306:3306 mariadb:10.5
```

İlk kurulumdan sonra şemayı ve örnek verileri yükleyin:

```bash
docker exec -i mariadb mariadb -uroot -proot54 tarimpro < db.sql
```

MariaDB başka bir sunucudaysa `.env` içindeki `DB_HOST`, `DB_PORT`, `DB_USERNAME` ve `DB_PASSWORD` değerlerini ayarlayın.

### TarımPro container'ını başlatma

```bash
docker compose up --build -d
```

Uygulama `http://localhost:4000`, health endpoint'i `http://localhost:4000/api/health` adresindedir.

```bash
docker compose logs -f tarim-app
docker compose down
```

Compose içindeki portlar:

| Host | Container | Açıklama |
|---:|---:|---|
| `4000` | `3001` | Production frontend ve API |
| `5174` | `5173` | Vite port eşlemesi; production image içinde Vite süreci çalışmaz |

Production Docker image yalnızca `node server.mjs` çalıştırır; normal kullanımda `http://localhost:4000` açılmalıdır.

## Veritabanı detayları

`db.sql` şu işlemleri yapar:

1. `tarimpro` veritabanını `utf8mb4` ve Türkçe collation ile oluşturur.
2. Tabloları, foreign key ilişkilerini ve örnek kayıtları ekler.
3. Analiz ekranının kullandığı view'ları oluşturur.
4. Teklif kontrolü otomasyonu için procedure ve trigger oluşturur.

Ana tablolar:

- `branches`, `users`, `customers`
- `field_teams`, `team_members`
- `field_jobs`, `field_job_images`
- `orders`, `order_items`
- `complaint_requests`
- `analysis_reports`

### Teklif kontrolü otomasyonu

`complaint_requests` tablosuna `subject = 'Teklif Talebi'` ve `offer_decision` değeriyle kayıt eklendiğinde `trg_offer_request_decision` trigger'ı çalışır.

- `Onaylandı`: `sp_process_offer_decision`, `orders` ve `order_items` tablolarına otomatik kayıt açar.
- `Reddedildi`: Procedure, `complaint_requests` tablosuna `Reddedilen Teklif` başlıklı yeni kayıt açar.

Procedure ve trigger kaynakları `db.sql` dosyasının son bölümündedir.

> `db.sql` içindeki örnek INSERT'ler benzersiz anahtarlar nedeniyle mevcut dolu veritabanında tekrar çalıştırılamayabilir. Yeni kurulumda boş `tarimpro` veritabanı kullanılması önerilir.

## API endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/health` | API ve veritabanı yapılandırmasını kontrol eder |
| GET | `/api/dashboard` | Dashboard özet sayılarını getirir |
| GET | `/api/orders` | Siparişleri müşteri ve ürün kalemleriyle listeler |
| GET | `/api/complaint-requests` | Şikayet ve talep kayıtlarını listeler |
| POST | `/api/offer-decisions` | Teklif Talebi kaydı açar ve otomasyonu başlatır |
| GET | `/api/analysis-reports` | Aktif raporları ve view sonuçlarını getirir |
| GET | `/api/field-jobs` | Saha işlerini listeler |
| POST | `/api/field-jobs` | Yeni saha işi oluşturur |
| PUT | `/api/field-jobs/:id` | Saha işini günceller |

Teklif kararı isteği örneği:

```json
{
  "requestNo": "TK-100",
  "offerNo": "TK-100",
  "customerId": 1,
  "branchId": 1,
  "productName": "Massey Ferguson 5710S",
  "amount": 84500,
  "decision": "Onaylandı"
}
```

## Uygulama modülleri

Genel Bakış, Markalar, Ürünler, Stok Takibi, Müşteriler, Siparişler, Tamir-Bakım, Şikayet-Talep, Depolar, Saha İşleri, Şubeler, Kullanıcı Yönetimi, Analiz & Raporlama ve Yapay Zeka Ajanları.

Yapay Zeka Ajanları altında Teklif Kontrolü AI Ajanı ve Sosyal Medya İçeriği Üret bulunur. Sosyal medya ajanında medya postu, 24 saatlik durum, 1 dakikalık video ve görsel için demo prompt akışı vardır. Demo çıktılarında `images/resim.jpg` ve `images/video.jpg` kullanılır.

## Kontrol komutları

```bash
npm run build       # TypeScript kontrolü ve production build
node --check server.mjs
npm run preview     # dist çıktısını Vite ile önizleme
```

## Sorun giderme

### `/api/...` endpoint'i bulunamadı

3001 portunda eski bir Node süreci çalışıyor olabilir. Eski süreci durdurup `npm run dev` veya `node server.mjs` komutunu yeniden çalıştırın.

### Veritabanı bağlantısı kurulamadı

MariaDB'nin çalıştığını, `.env` değerlerini, `tarimpro` veritabanının oluşturulduğunu ve Docker kullanıyorsanız MariaDB ile `tarim-app` container'larının aynı `app-network` ağına bağlı olduğunu kontrol edin.

### Docker uygulaması MariaDB'yi bulamıyor

Docker ağı kullanılırken `DB_HOST=localhost` yerine `DB_HOST=mariadb` kullanılmalıdır. Compose dosyası bu değeri varsayılan olarak ayarlar.
