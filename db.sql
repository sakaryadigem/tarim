-- TarımPro saha işleri veritabanı
-- MariaDB 10.5+ / InnoDB / utf8mb4

CREATE DATABASE IF NOT EXISTS tarimpro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_turkish_ci;
USE tarimpro;

CREATE TABLE IF NOT EXISTS branches (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  address VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branches_name (name),
  KEY idx_branches_city (city)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id INT UNSIGNED NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NULL,
  role ENUM('Yönetici','Operasyon','Servis Sorumlusu','Saha Personeli') NOT NULL DEFAULT 'Saha Personeli',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_branch (branch_id),
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id INT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  customer_type ENUM('Bireysel','Kurumsal') NOT NULL DEFAULT 'Kurumsal',
  contact_name VARCHAR(120) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customers_branch (branch_id),
  KEY idx_customers_name (name),
  CONSTRAINT fk_customers_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================================================================
-- SİPARİŞLER
-- ================================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(20) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Hazırlanıyor','Ödeme Alındı','Kargoda','Tamamlandı','İptal edildi') NOT NULL DEFAULT 'Hazırlanıyor',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_address VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_no (order_no),
  KEY idx_orders_customer (customer_id),
  KEY idx_orders_status (status),
  KEY idx_orders_date (order_date),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) AS (quantity * unit_price) STORED,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================================================================
-- ŞİKAYET - TALEP
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_no VARCHAR(20) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NULL,
  request_type ENUM('Şikayet','Talep') NOT NULL DEFAULT 'Talep',
  subject VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  offer_no VARCHAR(20) NULL,
  offer_product VARCHAR(180) NULL,
  offer_amount DECIMAL(12,2) NULL,
  offer_decision ENUM('Onaylandı','Reddedildi') NULL,
  priority ENUM('Düşük','Orta','Yüksek','Acil') NOT NULL DEFAULT 'Orta',
  status ENUM('Yeni','İnceleniyor','Çözüm bekliyor','Çözüldü','Kapatıldı') NOT NULL DEFAULT 'Yeni',
  assigned_to INT UNSIGNED NULL,
  opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_complaint_requests_no (request_no),
  KEY idx_complaint_requests_customer (customer_id),
  KEY idx_complaint_requests_status (status),
  KEY idx_complaint_requests_priority (priority),
  KEY idx_complaint_requests_offer (offer_no),
  CONSTRAINT fk_complaint_requests_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_complaint_requests_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_complaint_requests_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Mevcut kurulumlarda yeni teklif alanlarını da ekle.
ALTER TABLE complaint_requests ADD COLUMN IF NOT EXISTS offer_no VARCHAR(20) NULL AFTER description;
ALTER TABLE complaint_requests ADD COLUMN IF NOT EXISTS offer_product VARCHAR(180) NULL AFTER offer_no;
ALTER TABLE complaint_requests ADD COLUMN IF NOT EXISTS offer_amount DECIMAL(12,2) NULL AFTER offer_product;
ALTER TABLE complaint_requests ADD COLUMN IF NOT EXISTS offer_decision ENUM('Onaylandı','Reddedildi') NULL AFTER offer_amount;

CREATE TABLE IF NOT EXISTS field_teams (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id INT UNSIGNED NULL,
  name VARCHAR(80) NOT NULL,
  vehicle_plate VARCHAR(20) NULL,
  phone VARCHAR(30) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_field_teams_name (name),
  KEY idx_field_teams_branch (branch_id),
  CONSTRAINT fk_field_teams_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_members (
  team_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  is_leader TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (team_id, user_id),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES field_teams (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS field_jobs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_no VARCHAR(20) NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  created_by INT UNSIGNED NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(180) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status ENUM('Planlandı','Devam ediyor','Bekliyor','Tamamlandı','İptal edildi') NOT NULL DEFAULT 'Planlandı',
  priority ENUM('Düşük','Normal','Yüksek','Acil') NOT NULL DEFAULT 'Normal',
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_field_jobs_no (job_no),
  KEY idx_field_jobs_schedule (scheduled_date, scheduled_time),
  KEY idx_field_jobs_status (status),
  KEY idx_field_jobs_team_status (team_id, status),
  KEY idx_field_jobs_customer (customer_id),
  CONSTRAINT fk_field_jobs_team FOREIGN KEY (team_id) REFERENCES field_teams (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_field_jobs_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_field_jobs_created_by FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS field_job_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  field_job_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_field_job_images_job (field_job_id, sort_order),
  CONSTRAINT fk_field_job_images_job FOREIGN KEY (field_job_id) REFERENCES field_jobs (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO branches (id, name, city, address, phone) VALUES
  (1, 'Merkez Şube', 'Konya', 'Selçuklu, Ankara Caddesi No: 24', '0332 245 10 10'),
  (2, 'Ankara Şube', 'Ankara', 'Sincan Organize Sanayi Bölgesi', '0312 445 20 20');

INSERT INTO users (id, branch_id, full_name, email, phone, role) VALUES
  (1, 1, 'Selim Aksoy', 'selim.aksoy@tarimpro.local', '0532 100 10 01', 'Yönetici'),
  (2, 1, 'Ali Kaya', 'ali.kaya@tarimpro.local', '0532 100 10 02', 'Saha Personeli'),
  (3, 1, 'Burak Türkmen', 'burak.turkmen@tarimpro.local', '0532 100 10 03', 'Saha Personeli'),
  (4, 1, 'Can Yıldız', 'can.yildiz@tarimpro.local', '0532 100 10 04', 'Saha Personeli'),
  (5, 2, 'Ece Yıldırım', 'ece.yildirim@tarimpro.local', '0532 100 10 05', 'Operasyon'),
  (6, 2, 'Murat Kaya', 'murat.kaya@tarimpro.local', '0532 100 10 06', 'Saha Personeli');

INSERT INTO customers (id, branch_id, name, customer_type, contact_name, phone, city) VALUES
  (1, 1, 'Yıldız Tarım A.Ş.', 'Kurumsal', 'Hakan Yıldız', '0532 421 18 24', 'Konya'),
  (2, 1, 'Karaoğlu Çiftliği', 'Kurumsal', 'Mehmet Karaoğlu', '0541 288 67 10', 'Konya'),
  (3, 1, 'Bereket Kooperatifi', 'Kurumsal', 'Zeynep Çelik', '0382 214 90 12', 'Aksaray'),
  (4, 2, 'Ahmet Öztürk', 'Bireysel', 'Ahmet Öztürk', '0542 208 44 11', 'Ankara'),
  (5, 2, 'Güven Tarım', 'Kurumsal', 'İsmail Güven', '0536 515 72 42', 'Ankara'),
  (6, 1, 'Mehmet Demir', 'Bireysel', 'Mehmet Demir', '0505 320 13 08', 'Konya');

INSERT INTO orders (id, order_no, customer_id, branch_id, order_date, status, total_amount, shipping_address) VALUES
  (1, 'SP-1048', 1, 1, '2026-09-02 09:42:00', 'Hazırlanıyor', 84500.00, 'Selçuklu / Konya'),
  (2, 'SP-1047', 4, 2, '2026-09-02 09:15:00', 'Ödeme Alındı', 12850.00, 'Sincan / Ankara'),
  (3, 'SP-1046', 3, 1, '2026-09-01 16:38:00', 'Tamamlandı', 56200.00, 'Aksaray Merkez'),
  (4, 'SP-1045', 2, 1, '2026-09-01 14:20:00', 'Kargoda', 8460.00, 'Karatay / Konya');

INSERT INTO order_items (order_id, product_name, quantity, unit_price) VALUES
  (1, 'Massey Ferguson 5710S', 1, 84500.00),
  (2, 'Hidrolik Pompa — 3226', 1, 12850.00),
  (3, 'John Deere 5075E', 1, 56200.00),
  (4, 'Debriyaj Seti — 8450', 1, 8460.00);

INSERT INTO complaint_requests (id, request_no, customer_id, branch_id, request_type, subject, description, priority, status, assigned_to, opened_at) VALUES
  (1, 'TK-083', 4, 2, 'Şikayet', 'Teslimat gecikmesi', 'Siparişin planlanan tarihte teslim edilmediği bildirildi.', 'Yüksek', 'İnceleniyor', 5, '2026-09-02 08:35:00'),
  (2, 'TK-082', 3, 1, 'Talep', 'Parça değişimi', 'Garanti kapsamında parça değişimi için destek talep ediliyor.', 'Orta', 'Çözüm bekliyor', 1, '2026-09-01 15:10:00'),
  (3, 'TK-081', 2, 1, 'Talep', 'Teklif talebi', 'Yeni ekipman için fiyat teklifi isteniyor.', 'Düşük', 'Yeni', 1, '2026-09-01 11:20:00');

INSERT INTO field_teams (id, branch_id, name, vehicle_plate, phone) VALUES
  (1, 1, 'Ekip A', '42 SF 241', '0532 700 11 01'),
  (2, 1, 'Ekip B', '42 SF 242', '0532 700 11 02'),
  (3, 1, 'Ekip C', '42 SF 243', '0532 700 11 03'),
  (4, 2, 'Ekip D', '06 SF 244', '0532 700 11 04');

INSERT INTO team_members (team_id, user_id, is_leader) VALUES
  (1, 2, 1), (2, 4, 1), (3, 3, 1), (4, 6, 1), (4, 5, 0);

-- 20 örnek saha işi kaydı
INSERT INTO field_jobs (id, job_no, team_id, customer_id, created_by, title, description, location, scheduled_date, scheduled_time, status, priority) VALUES
  (1, 'SF-0241', 1, 1, 1, 'Periyodik bakım', '500 saatlik bakım; motor yağı, filtreler ve hidrolik sistem kontrol edilecek.', 'Çumra / Konya', '2026-09-01', '08:30:00', 'Planlandı', 'Normal'),
  (2, 'SF-0240', 3, 2, 1, 'Arıza tespiti', 'Hidrolik kaldırma sistemindeki güç kaybı için kapsamlı arıza tespiti yapılacak.', 'Meram / Konya', '2026-09-01', '09:15:00', 'Devam ediyor', 'Yüksek'),
  (3, 'SF-0239', 2, 3, 1, 'Teslimat', 'Hidrolik pompa ve montaj kitinin teslimatı ile teslim tutanağı işlemleri yapılacak.', 'Karatay / Konya', '2026-09-01', '10:00:00', 'Bekliyor', 'Normal'),
  (4, 'SF-0238', 1, 6, 1, 'Motor kontrolü', 'Motor çalışma sıcaklığı ve yağ basıncı ölçümleri alınacak.', 'Selçuklu / Konya', '2026-09-01', '10:45:00', 'Planlandı', 'Normal'),
  (5, 'SF-0237', 4, 4, 5, 'Filtre değişimi', 'Yakıt ve hava filtreleri değiştirilecek, eski parçalar servise getirilecek.', 'Sincan / Ankara', '2026-09-01', '11:30:00', 'Planlandı', 'Düşük'),
  (6, 'SF-0236', 1, 1, 1, 'Lastik kontrolü', 'Dört lastiğin basınç, diş ve bijon kontrolleri yapılacak.', 'Çumra / Konya', '2026-09-02', '08:00:00', 'Planlandı', 'Düşük'),
  (7, 'SF-0235', 3, 3, 1, 'Elektrik arızası', 'Marş motoru ve akü bağlantıları kontrol edilerek arıza giderilecek.', 'Aksaray Merkez', '2026-09-02', '09:30:00', 'Planlandı', 'Yüksek'),
  (8, 'SF-0234', 2, 5, 1, 'Ürün kurulumu', 'Yeni ilaçlama makinesinin kurulumu ve kullanıcı eğitimi yapılacak.', 'Polatlı / Ankara', '2026-09-02', '10:00:00', 'Planlandı', 'Normal'),
  (9, 'SF-0233', 4, 4, 5, 'Garanti incelemesi', 'Garanti kapsamındaki titreşim şikayeti incelenerek raporlanacak.', 'Etimesgut / Ankara', '2026-09-02', '13:15:00', 'Bekliyor', 'Normal'),
  (10, 'SF-0232', 1, 2, 1, 'Hidrolik yağ değişimi', 'Hidrolik yağ ve dönüş filtresi yenilenerek kaçak kontrolü yapılacak.', 'Ereğli / Konya', '2026-09-03', '08:45:00', 'Planlandı', 'Normal'),
  (11, 'SF-0231', 3, 1, 1, 'Şanzıman kontrolü', 'Vites geçişleri test edilip şanzıman yağ seviyesi ölçülecek.', 'Meram / Konya', '2026-09-03', '09:00:00', 'Tamamlandı', 'Yüksek'),
  (12, 'SF-0230', 2, 6, 1, 'Klimatizasyon bakımı', 'Kabin klima gazı, fanı ve filtreleri kontrol edilecek.', 'Karatay / Konya', '2026-09-03', '11:00:00', 'Planlandı', 'Düşük'),
  (13, 'SF-0229', 4, 5, 5, 'Teslimat ve eğitim', 'Biçerdöver teslimi ve temel kullanım eğitimi gerçekleştirilecek.', 'Beypazarı / Ankara', '2026-09-04', '08:30:00', 'Planlandı', 'Normal'),
  (14, 'SF-0228', 1, 3, 1, 'Fren sistemi kontrolü', 'Fren balataları ve hidrolik devre güvenlik kontrolünden geçirilecek.', 'Cihanbeyli / Konya', '2026-09-04', '10:30:00', 'Planlandı', 'Acil'),
  (15, 'SF-0227', 3, 2, 1, 'PTO ayarı', 'Kuyruk mili devri ölçülerek PTO kavrama ayarı yapılacak.', 'Ilgın / Konya', '2026-09-04', '13:00:00', 'Bekliyor', 'Normal'),
  (16, 'SF-0226', 2, 1, 1, 'Yazılım güncellemesi', 'Araç kontrol ünitesi yazılımı güncellenecek ve test sürüşü yapılacak.', 'Akşehir / Konya', '2026-09-05', '09:15:00', 'Planlandı', 'Normal'),
  (17, 'SF-0225', 4, 4, 5, 'Römork bağlantısı', 'Römork bağlantı ekipmanı takılıp güvenlik kilitleri test edilecek.', 'Çankaya / Ankara', '2026-09-05', '10:00:00', 'Tamamlandı', 'Düşük'),
  (18, 'SF-0224', 1, 6, 1, 'Genel servis', 'Sezon öncesi genel servis, gresleme ve bağlantı sıkılık kontrolleri yapılacak.', 'Bozkır / Konya', '2026-09-06', '08:00:00', 'Planlandı', 'Normal'),
  (19, 'SF-0223', 3, 3, 1, 'Yakıt sistemi temizliği', 'Yakıt hattı ve enjektörler kontrol edilerek sistem temizlenecek.', 'Ortaköy / Aksaray', '2026-09-06', '11:15:00', 'Planlandı', 'Yüksek'),
  (20, 'SF-0222', 2, 5, 1, 'Makine teslimatı', 'Sipariş edilen ekipman teslim edilip ürün kabul formu imzalatılacak.', 'Haymana / Ankara', '2026-09-07', '14:00:00', 'Planlandı', 'Normal');

INSERT INTO field_job_images (field_job_id, image_url, caption, sort_order) VALUES
  (1, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80', 'Bakım yapılacak traktör', 1),
  (1, 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1200&q=80', 'Saha ekipmanı', 2),
  (2, 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80', 'Arıza tespit ekipmanı', 1),
  (3, 'https://images.unsplash.com/photo-1586528116493-da8b0f0c7f43?auto=format&fit=crop&w=1200&q=80', 'Teslimat görseli', 1),
  (8, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', 'Kurulum alanı', 1),
  (13, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80', 'Teslim edilecek makine', 1);

-- ================================================================
-- ANALİZ & RAPORLAMA
-- Rapor ekranında listelenebilecek örnek rapor tanımları
-- ================================================================

CREATE TABLE IF NOT EXISTS analysis_reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_key VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(500) NOT NULL,
  view_name VARCHAR(120) NOT NULL,
  category ENUM('Operasyon','Performans','Müşteri','Kalite') NOT NULL DEFAULT 'Operasyon',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_analysis_reports_key (report_key),
  UNIQUE KEY uq_analysis_reports_view (view_name)
) ENGINE=InnoDB;

INSERT INTO analysis_reports (id, report_key, title, description, view_name, category) VALUES
  (1, 'daily-job-summary', 'Günlük saha işi özeti', 'Tarih bazında toplam, tamamlanan ve açık saha işlerini gösterir.', 'vw_daily_field_job_summary', 'Operasyon'),
  (2, 'status-summary', 'İş durumu dağılımı', 'Planlanan saha işlerinin durumlara göre dağılımını gösterir.', 'vw_field_job_status_summary', 'Operasyon'),
  (3, 'team-workload', 'Ekip iş yükü', 'Ekiplerin toplam iş, açık iş ve tamamlanma oranlarını karşılaştırır.', 'vw_field_team_workload', 'Performans'),
  (4, 'customer-activity', 'Müşteri saha aktivitesi', 'Müşteri bazında iş sayısı, son iş tarihi ve tamamlanma durumunu listeler.', 'vw_customer_field_activity', 'Müşteri'),
  (5, 'branch-performance', 'Şube operasyon performansı', 'Şubelerin ekip, müşteri ve saha işi hacmini karşılaştırır.', 'vw_branch_operation_performance', 'Performans'),
  (6, 'priority-summary', 'Öncelik analizi', 'Acil ve yüksek öncelikli işlerin durum dağılımını gösterir.', 'vw_field_job_priority_summary', 'Kalite'),
  (7, 'completion-performance', 'Tamamlanma performansı', 'Ekiplerin tamamlanan iş ve tamamlanma oranlarını sıralar.', 'vw_field_job_completion_performance', 'Performans'),
  (8, 'upcoming-jobs', 'Yaklaşan saha işleri', 'Bugün ve sonraki planlanan saha işlerini ekip ve müşteri bilgisiyle getirir.', 'vw_upcoming_field_jobs', 'Operasyon'),
  (9, 'image-coverage', 'Görev görsel kapsamı', 'Görseli olan ve olmayan saha işlerini karşılaştırır.', 'vw_field_job_image_coverage', 'Kalite'),
  (10, 'monthly-trend', 'Aylık iş trendi', 'Ay bazında saha işi hacmini ve tamamlanma oranını gösterir.', 'vw_monthly_field_job_trend', 'Performans');

-- 1. Günlük saha işi özeti
CREATE OR REPLACE VIEW vw_daily_field_job_summary AS
SELECT scheduled_date,
       COUNT(*) AS total_jobs,
       SUM(status = 'Tamamlandı') AS completed_jobs,
       SUM(status IN ('Planlandı', 'Devam ediyor', 'Bekliyor')) AS open_jobs,
       SUM(status = 'İptal edildi') AS cancelled_jobs
FROM field_jobs
GROUP BY scheduled_date;

-- 2. Durum dağılımı
CREATE OR REPLACE VIEW vw_field_job_status_summary AS
SELECT status, COUNT(*) AS job_count,
       ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM field_jobs), 0), 2) AS percentage
FROM field_jobs
GROUP BY status;

-- 3. Ekip iş yükü
CREATE OR REPLACE VIEW vw_field_team_workload AS
SELECT ft.id AS team_id, ft.name AS team_name, b.name AS branch_name,
       COUNT(fj.id) AS total_jobs,
       SUM(fj.status = 'Tamamlandı') AS completed_jobs,
       SUM(fj.status <> 'Tamamlandı' AND fj.status <> 'İptal edildi') AS open_jobs
FROM field_teams ft
LEFT JOIN branches b ON b.id = ft.branch_id
LEFT JOIN field_jobs fj ON fj.team_id = ft.id
GROUP BY ft.id, ft.name, b.name;

-- 4. Müşteri saha aktivitesi
CREATE OR REPLACE VIEW vw_customer_field_activity AS
SELECT c.id AS customer_id, c.name AS customer_name, c.customer_type,
       COUNT(fj.id) AS total_jobs,
       SUM(fj.status = 'Tamamlandı') AS completed_jobs,
       MAX(fj.scheduled_date) AS last_job_date
FROM customers c
LEFT JOIN field_jobs fj ON fj.customer_id = c.id
GROUP BY c.id, c.name, c.customer_type;

-- 5. Şube operasyon performansı
CREATE OR REPLACE VIEW vw_branch_operation_performance AS
SELECT b.id AS branch_id, b.name AS branch_name, b.city,
       (SELECT COUNT(*) FROM field_teams ft WHERE ft.branch_id = b.id) AS team_count,
       (SELECT COUNT(*) FROM customers c WHERE c.branch_id = b.id) AS customer_count,
       (SELECT COUNT(*) FROM field_jobs fj JOIN field_teams ft ON ft.id = fj.team_id WHERE ft.branch_id = b.id) AS total_jobs,
       (SELECT COUNT(*) FROM field_jobs fj JOIN field_teams ft ON ft.id = fj.team_id WHERE ft.branch_id = b.id AND fj.status = 'Tamamlandı') AS completed_jobs
FROM branches b
GROUP BY b.id, b.name, b.city;

-- 6. Öncelik analizi
CREATE OR REPLACE VIEW vw_field_job_priority_summary AS
SELECT priority, COUNT(*) AS total_jobs,
       SUM(status = 'Tamamlandı') AS completed_jobs,
       SUM(status IN ('Planlandı', 'Devam ediyor', 'Bekliyor')) AS open_jobs
FROM field_jobs
GROUP BY priority;

-- 7. Ekip tamamlanma performansı
CREATE OR REPLACE VIEW vw_field_job_completion_performance AS
SELECT ft.id AS team_id, ft.name AS team_name,
       COUNT(fj.id) AS total_jobs,
       SUM(fj.status = 'Tamamlandı') AS completed_jobs,
       ROUND(SUM(fj.status = 'Tamamlandı') * 100.0 / NULLIF(COUNT(fj.id), 0), 2) AS completion_rate
FROM field_teams ft
LEFT JOIN field_jobs fj ON fj.team_id = ft.id
GROUP BY ft.id, ft.name;

-- 8. Yaklaşan işler
CREATE OR REPLACE VIEW vw_upcoming_field_jobs AS
SELECT fj.id, fj.job_no, fj.title, fj.location, fj.scheduled_date, fj.scheduled_time,
       fj.status, fj.priority, ft.name AS team_name, c.name AS customer_name
FROM field_jobs fj
JOIN field_teams ft ON ft.id = fj.team_id
JOIN customers c ON c.id = fj.customer_id
WHERE fj.status IN ('Planlandı', 'Devam ediyor', 'Bekliyor')
  AND fj.scheduled_date >= CURDATE();

-- 9. Görsel kapsamı
CREATE OR REPLACE VIEW vw_field_job_image_coverage AS
SELECT fj.id AS field_job_id, fj.job_no, fj.title, fj.status,
       COUNT(fji.id) AS image_count,
       CASE WHEN COUNT(fji.id) > 0 THEN 'Görsel mevcut' ELSE 'Görsel eksik' END AS image_status
FROM field_jobs fj
LEFT JOIN field_job_images fji ON fji.field_job_id = fj.id
GROUP BY fj.id, fj.job_no, fj.title, fj.status;

-- 10. Aylık iş trendi
CREATE OR REPLACE VIEW vw_monthly_field_job_trend AS
SELECT DATE_FORMAT(scheduled_date, '%Y-%m') AS year_month,
       COUNT(*) AS total_jobs,
       SUM(status = 'Tamamlandı') AS completed_jobs,
       ROUND(SUM(status = 'Tamamlandı') * 100.0 / NULLIF(COUNT(*), 0), 2) AS completion_rate
FROM field_jobs
GROUP BY DATE_FORMAT(scheduled_date, '%Y-%m');

-- ================================================================
-- TEKLİF KONTROLÜ AI AJANI OTOMASYONU
-- Teklif onaylanırsa sipariş, reddedilirse yeni bir şikayet/talep kaydı açılır.
-- ================================================================
DROP PROCEDURE IF EXISTS sp_process_offer_decision;
DELIMITER $$
CREATE PROCEDURE sp_process_offer_decision(
  IN p_request_id INT UNSIGNED,
  IN p_offer_no VARCHAR(20),
  IN p_customer_id INT UNSIGNED,
  IN p_branch_id INT UNSIGNED,
  IN p_product_name VARCHAR(180),
  IN p_amount DECIMAL(12,2),
  IN p_decision ENUM('Onaylandı','Reddedildi')
)
BEGIN
  IF p_decision = 'Onaylandı' THEN
    INSERT INTO orders (order_no, customer_id, branch_id, order_date, status, total_amount, notes)
    VALUES (CONCAT('AI-', p_offer_no), p_customer_id, p_branch_id, NOW(), 'Hazırlanıyor', p_amount, 'Teklif Kontrolü AI Ajanı tarafından otomatik oluşturuldu.');

    INSERT INTO order_items (order_id, product_name, quantity, unit_price)
    VALUES (LAST_INSERT_ID(), p_product_name, 1, p_amount);

  ELSEIF p_decision = 'Reddedildi' THEN
    INSERT INTO complaint_requests (request_no, customer_id, branch_id, request_type, subject, description, priority, status, offer_no, offer_product, offer_amount, offer_decision)
    VALUES (CONCAT('RD-', p_offer_no), p_customer_id, p_branch_id, 'Talep', 'Reddedilen Teklif',
      CONCAT('Teklif ', p_offer_no, ' AI ajanı tarafından reddedildi.'), 'Orta', 'Yeni', p_offer_no, p_product_name, p_amount, p_decision);

  END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_offer_request_decision;
DELIMITER $$
CREATE TRIGGER trg_offer_request_decision
AFTER INSERT ON complaint_requests
FOR EACH ROW
BEGIN
  IF NEW.subject = 'Teklif Talebi' AND NEW.offer_decision IS NOT NULL THEN
    CALL sp_process_offer_decision(NEW.id, NEW.offer_no, NEW.customer_id, NEW.branch_id,
      NEW.offer_product, NEW.offer_amount, NEW.offer_decision);
  END IF;
END$$
DELIMITER ;
