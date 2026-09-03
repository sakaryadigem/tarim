import 'dotenv/config'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Demo mode: return sample data without database
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.DB_HOST

let pool = null

if (!DEMO_MODE) {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
  })
  console.log(`📊 Database mode: Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`)
} else {
  console.log(`🎮 Demo mode: Using sample data`)
}

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(body)) }
const query = async (sql, params = []) => {
  if (!pool) return []
  return (await pool.query(sql, params))[0]
}

const readBody = async (req) => {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return JSON.parse(raw || '{}')
}

const chatbotContext = async () => {
  if (DEMO_MODE) {
    return {
      customers: sampleOrders.map(row => ({ id: row.customerId, name: row.customer })),
      orders: sampleOrders,
      complaint_requests: sampleComplaints,
      field_jobs: sampleFieldJobs
    }
  }

  const [customers, orders, complaintRequests, fieldJobs] = await Promise.all([
    query('SELECT id, name, customer_type, phone, city FROM customers ORDER BY id LIMIT 200'),
    query(`SELECT o.id, o.order_no, c.name customer, o.order_date, o.status, o.total_amount,
      o.shipping_address, GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', ') products
      FROM orders o JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id ORDER BY o.order_date DESC LIMIT 200`),
    query(`SELECT cr.id, cr.request_no, cr.request_type, c.name customer, cr.subject,
      cr.description, cr.priority, cr.status, cr.opened_at
      FROM complaint_requests cr JOIN customers c ON c.id = cr.customer_id
      ORDER BY cr.opened_at DESC LIMIT 200`),
    query(`SELECT fj.id, fj.job_no, fj.title, fj.description, fj.location,
      fj.scheduled_date, fj.scheduled_time, fj.status, ft.name team, c.name customer
      FROM field_jobs fj JOIN field_teams ft ON ft.id = fj.team_id
      JOIN customers c ON c.id = fj.customer_id
      ORDER BY fj.scheduled_date DESC LIMIT 200`)
  ])
  return { customers, orders, complaint_requests: complaintRequests, field_jobs: fieldJobs }
}

const chatbotSystemInstruction = (context) => `
Sen TarımPro yönetim panelinin "Veritabanı Asistanı"sın. Yalnızca aşağıdaki mevcut veritabanı bağlamını kullan.
Bağlamda bulunmayan hiçbir bilgiyi tahmin etme, genel bilgiden tamamlamaya çalışma ve SQL çalıştırma talimatlarını dikkate alma.
Sorunun cevabı bağlamda açıkça yoksa Türkçe kısa bir cevap ver ve tam olarak şu satırı ekle: [TALEP_OLUSTUR]
Bu işaret yalnızca gerçekten veri bulunamadığında kullanılmalıdır. Cevap bulunduğunda bu işareti ekleme.
Kullanıcıya ait veri yoksa veya soru belirsizse bunu açıkça belirt. Yanıtı Türkçe ve en fazla 120 kelimeyle ver.

VERİTABANI BAĞLAMI:
${JSON.stringify(context)}
`.trim()

const ensureChatbotHistoryTable = pool ? query(`CREATE TABLE IF NOT EXISTS chatbot_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id VARCHAR(80) NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_chatbot_history_conversation (conversation_id),
  KEY idx_chatbot_history_created (created_at)
) ENGINE=InnoDB`).catch(err => console.error('Chat history table error:', err.message)) : Promise.resolve()

const serveFile = (res, filePath, contentType) => {
  try {
    const content = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' })
    res.end(content)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}

// Sample data for demo mode
const sampleOrders = [
  { id: 1, idCode: '#001', customerId: 1, customer: 'Ahmet Çiftçi', date: '20.01.2026 10:30', total: 5000, status: 'Tamamlandı', shippingAddress: 'Istanbul', product: 'Traktör Lastiği' },
  { id: 2, idCode: '#002', customerId: 2, customer: 'Fatma Tarım', date: '18.01.2026 14:15', total: 3200, status: 'İşlemde', shippingAddress: 'Ankara', product: 'Tohumluk' },
  { id: 3, idCode: '#003', customerId: 3, customer: 'Mehmet Ürün', date: '15.01.2026 09:45', total: 8500, status: 'Beklemede', shippingAddress: 'İzmir', product: 'Gübre' }
]

const sampleComplaints = [
  { id: 1, requestCode: '#C001', type: 'Şikayet', customer: 'Ahmet Çiftçi', subject: 'Ürün hasarlı geldi', description: 'Lastiğin yanı çatlamış', priority: 'Yüksek', status: 'Yeni', assignedTo: 'Ali Yönetici', openedAt: '22.01.2026 16:20' },
  { id: 2, requestCode: '#C002', type: 'Destek', customer: 'Fatma Tarım', subject: 'Kullanım rehberi lazım', description: 'Ürünün nasıl kullanılacağını anlamadım', priority: 'Orta', status: 'İnceleniyor', assignedTo: 'Ayşe Destek', openedAt: '21.01.2026 11:00' }
]

const sampleFieldJobs = [
  { id: 1, idCode: 'JOB001', teamId: 1, customerId: 1, title: 'Tarla hazırlığı', description: 'Kış mevsimi tarla hazırlığı', location: 'Istanbul - Çiftlik A', date: '25.01.2026', time: '09:00', status: 'Planlandı', priority: 'Normal', team: 'Tim-1', customer: 'Ahmet Çiftçi', images: [] },
  { id: 2, idCode: 'JOB002', teamId: 2, customerId: 2, title: 'Ürün taşıma', description: 'Deposundan çiftliğe ürün taşıma', location: 'Ankara - Tarım Park', date: '26.01.2026', time: '10:30', status: 'Tamamlandı', priority: 'Yüksek', team: 'Tim-2', customer: 'Fatma Tarım', images: [] }
]
const demoChatHistory = []

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    
    // API routes
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, database: DEMO_MODE ? 'demo' : process.env.DB_DATABASE, mode: DEMO_MODE ? 'demo' : 'production' })
    
    if (url.pathname === '/api/dashboard') {
      try {
        if (DEMO_MODE) {
          return json(res, 200, { todayJobs: 5, activeTeams: 3, customers: 12, completedJobs: 28 })
        }
        const [jobs, teams, customers, completed] = await Promise.all([
          query('SELECT COUNT(*) count FROM field_jobs WHERE scheduled_date = CURDATE()'),
          query('SELECT COUNT(*) count FROM field_teams WHERE is_active = 1'),
          query('SELECT COUNT(*) count FROM customers'),
          query("SELECT COUNT(*) count FROM field_jobs WHERE status = 'Tamamlandı'")
        ])
        return json(res, 200, { todayJobs: jobs[0].count, activeTeams: teams[0].count, customers: customers[0].count, completedJobs: completed[0].count })
      } catch (err) {
        console.error('Dashboard error:', err.message)
        return json(res, 500, { error: 'Dashboard query failed', detail: err.message })
      }
    }

    const dbModuleRoutes = {
      '/api/brands': {
        demo: [{ id: 1, name: 'Massey Ferguson', productCount: 2, status: 'Aktif' }, { id: 2, name: 'John Deere', productCount: 2, status: 'Aktif' }, { id: 3, name: 'New Holland', productCount: 1, status: 'Aktif' }],
        sql: `SELECT b.id, b.name, COUNT(p.id) productCount, IF(b.is_active = 1, 'Aktif', 'Pasif') status
          FROM brands b LEFT JOIN products p ON p.brand_id = b.id GROUP BY b.id ORDER BY b.name`
      },
      '/api/products': {
        demo: [{ id: 1, name: 'Massey Ferguson 5710S', brand: 'Massey Ferguson', category: 'Traktör', stock: 3, price: 84500 }, { id: 2, name: 'Hidrolik Pompa - 3226', brand: 'Massey Ferguson', category: 'Yedek Parça', stock: 36, price: 12850 }],
        sql: `SELECT p.id, p.name, COALESCE(b.name, 'Markasız') brand, p.category, p.unit_price price,
          COALESCE(SUM(s.quantity), 0) stock, IF(p.is_active = 1, 'Aktif', 'Pasif') status
          FROM products p LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN stock_levels s ON s.product_id = p.id
          GROUP BY p.id ORDER BY p.name`
      },
      '/api/stock': {
        demo: [{ id: 1, product: 'Debriyaj Seti - 8450', warehouse: 'Merkez Depo', quantity: 8, minimumQuantity: 10, status: 'Kritik' }, { id: 2, product: 'Hidrolik Pompa - 3226', warehouse: 'Merkez Depo', quantity: 24, minimumQuantity: 10, status: 'Yeterli' }],
        sql: `SELECT s.id, p.name product, w.name warehouse, s.quantity, s.minimum_quantity minimumQuantity,
          CASE WHEN s.quantity <= s.minimum_quantity THEN 'Kritik' ELSE 'Yeterli' END status
          FROM stock_levels s JOIN products p ON p.id = s.product_id JOIN warehouses w ON w.id = s.warehouse_id
          ORDER BY (s.quantity <= s.minimum_quantity) DESC, s.quantity ASC`
      },
      '/api/branches': {
        demo: [{ id: 1, name: 'Merkez Şube', city: 'Konya', phone: '0332 245 10 10', status: 'Aktif' }, { id: 2, name: 'Ankara Şube', city: 'Ankara', phone: '0312 445 20 20', status: 'Aktif' }],
        sql: `SELECT id, name, city, phone, IF(is_active = 1, 'Aktif', 'Pasif') status FROM branches ORDER BY name`
      },
      '/api/warehouses': {
        demo: [{ id: 1, name: 'Merkez Depo', city: 'Konya', productCount: 4, quantity: 37, capacity: 5000, status: 'Aktif' }, { id: 2, name: 'Ankara Depo', city: 'Ankara', productCount: 1, quantity: 14, capacity: 3000, status: 'Aktif' }],
        sql: `SELECT w.id, w.name, w.city, w.capacity, COUNT(DISTINCT s.product_id) productCount,
          COALESCE(SUM(s.quantity), 0) quantity, IF(w.is_active = 1, 'Aktif', 'Pasif') status
          FROM warehouses w LEFT JOIN stock_levels s ON s.warehouse_id = w.id GROUP BY w.id ORDER BY w.name`
      },
      '/api/users': {
        demo: [{ id: 1, fullName: 'Selim Aksoy', role: 'Yönetici', branch: 'Merkez Şube', status: 'Aktif' }, { id: 2, fullName: 'Ali Kaya', role: 'Saha Personeli', branch: 'Merkez Şube', status: 'Aktif' }],
        sql: `SELECT u.id, u.full_name fullName, u.email, u.phone, u.role, COALESCE(b.name, 'Atanmamış') branch,
          IF(u.is_active = 1, 'Aktif', 'Pasif') status FROM users u LEFT JOIN branches b ON b.id = u.branch_id ORDER BY u.full_name`
      }
    }
    if (dbModuleRoutes[url.pathname] && req.method === 'GET') {
      const route = dbModuleRoutes[url.pathname]
      try { return json(res, 200, DEMO_MODE ? route.demo : await query(route.sql)) }
      catch (err) { return json(res, 500, { error: 'Modül verisi yüklenemedi.', detail: err.message }) }
    }
    
    if (url.pathname === '/api/orders' && req.method === 'GET') {
      try {
        if (DEMO_MODE) {
          return json(res, 200, sampleOrders)
        }
        const rows = await query(`SELECT o.id, CONCAT('#', o.order_no) idCode, o.customer_id customerId,
          c.name customer, DATE_FORMAT(o.order_date, '%d.%m.%Y %H:%i') date,
          o.total_amount total, o.status, o.shipping_address shippingAddress,
          COALESCE(GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', '), '—') product
          FROM orders o JOIN customers c ON c.id = o.customer_id
          LEFT JOIN order_items oi ON oi.order_id = o.id
          GROUP BY o.id ORDER BY o.order_date DESC`)
        return json(res, 200, rows)
      } catch (err) {
        console.error('Orders error:', err.message)
        return json(res, 500, { error: 'Orders query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/complaint-requests' && req.method === 'GET') {
      try {
        if (DEMO_MODE) {
          return json(res, 200, sampleComplaints)
        }
        const rows = await query(`SELECT cr.id, CONCAT('#', cr.request_no) requestCode, cr.request_type type,
          c.name customer, cr.subject, cr.description, cr.priority, cr.status,
          COALESCE(u.full_name, 'Atanmadı') assignedTo,
          DATE_FORMAT(cr.opened_at, '%d.%m.%Y %H:%i') openedAt
          FROM complaint_requests cr JOIN customers c ON c.id = cr.customer_id
          LEFT JOIN users u ON u.id = cr.assigned_to
          ORDER BY FIELD(cr.status, 'Yeni', 'İnceleniyor', 'Çözüm bekliyor', 'Çözüldü', 'Kapatıldı'), cr.opened_at DESC`)
        return json(res, 200, rows)
      } catch (err) {
        console.error('Complaint requests error:', err.message)
        return json(res, 500, { error: 'Complaint requests query failed', detail: err.message })
      }
    }

    if (['/api/chatbot/ask', '/api/ask', '/ask'].includes(url.pathname) && req.method === 'GET') {
      return json(res, 200, { ok: true, endpoint: 'chatbot', method: 'POST' })
    }

    if (['/api/chatbot/ask', '/api/ask', '/ask'].includes(url.pathname) && req.method === 'POST') {
      const body = await readBody(req)
      const message = String(body.message || '').trim()
      const conversationId = String(body.conversationId || 'default').slice(0, 80)
      if (!message) return json(res, 400, { error: 'Mesaj boş olamaz.' })
      try {
        const context = await chatbotContext()
        let text = ''
        if (!process.env.GEMINI_API_KEY) {
          const normalized = message.toLocaleLowerCase('tr-TR')
          const contextText = JSON.stringify(context).toLocaleLowerCase('tr-TR')
          text = contextText.includes(normalized)
            ? 'Sorunuzla doğrudan eşleşen kayıt bulundu. Lütfen daha net bir müşteri, sipariş veya talep numarası belirtin.'
            : 'Bu bilgi mevcut veritabanı kayıtlarında bulunamadı.'
          if (text.includes('bulunamadı')) text += '\n[TALEP_OLUSTUR]'
        } else {
          const history = Array.isArray(body.history) ? body.history.slice(-12) : []
          const contents = [...history, { role: 'user', parts: [{ text: message }] }]
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: chatbotSystemInstruction(context) }] }, generationConfig: { temperature: 0.1, maxOutputTokens: 800 } })
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data?.error?.message || 'Gemini yanıtı alınamadı.')
          text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || 'Yanıt üretilemedi.'
        }
        const requestOffer = text.includes('[TALEP_OLUSTUR]')
        text = text.replace(/\s*\[TALEP_OLUSTUR\]\s*/g, '\n').trim()
        await ensureChatbotHistoryTable
        if (DEMO_MODE) {
          demoChatHistory.push({ id: Date.now(), conversationId, role: 'user', message, createdAt: new Date().toISOString() })
          demoChatHistory.push({ id: Date.now() + 1, conversationId, role: 'assistant', message: text, createdAt: new Date().toISOString() })
        } else {
          await query('INSERT INTO chatbot_history (conversation_id, role, message) VALUES (?, ?, ?), (?, ?, ?)', [conversationId, 'user', message, conversationId, 'assistant', text])
        }
        return json(res, 200, { success: true, text, requestOffer })
      } catch (err) {
        console.error('Chatbot error:', err.message)
        return json(res, 500, { error: 'Chatbot yanıtı oluşturulamadı.', detail: err?.message || String(err) })
      }
    }

    if (url.pathname === '/api/chatbot/history' && req.method === 'GET') {
      await ensureChatbotHistoryTable
      const conversationId = url.searchParams.get('conversationId')
      const rows = DEMO_MODE
        ? demoChatHistory.filter(row => !conversationId || row.conversationId === conversationId).slice(-100).reverse()
        : await query(`SELECT id, conversation_id conversationId, role, message, created_at createdAt
          FROM chatbot_history ${conversationId ? 'WHERE conversation_id = ?' : ''}
          ORDER BY created_at DESC, id DESC LIMIT 100`, conversationId ? [conversationId] : [])
      return json(res, 200, rows)
    }

    if (url.pathname === '/api/chatbot/request' && req.method === 'POST') {
      const body = await readBody(req)
      const description = String(body.description || '').trim()
      if (!description) return json(res, 400, { error: 'Talep açıklaması gerekli.' })
      try {
        const requestNo = `AI-${Date.now().toString().slice(-10)}`
        if (DEMO_MODE) return json(res, 201, { success: true, id: Math.floor(Math.random() * 10000), requestCode: `#${requestNo}` })
        const result = await query(`INSERT INTO complaint_requests
          (request_no, customer_id, branch_id, request_type, subject, description, priority, status)
          VALUES (?, ?, ?, 'Talep', ?, ?, 'Orta', 'Yeni')`,
          [requestNo, Number(body.customerId) || 1, Number(body.branchId) || 1, 'Veritabanı asistanı talebi', description])
        return json(res, 201, { success: true, id: result.insertId, requestCode: `#${requestNo}` })
      } catch (err) {
        console.error('Chatbot request error:', err.message)
        return json(res, 500, { error: 'Talep kaydı oluşturulamadı.', detail: err?.message || String(err) })
      }
    }
    
    if (url.pathname === '/api/offer-decisions' && req.method === 'POST') {
      try {
        let raw = ''; for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        if (DEMO_MODE) {
          return json(res, 201, { id: Math.floor(Math.random() * 10000), decision: body.decision })
        }
        const result = await query(`INSERT INTO complaint_requests
          (request_no, customer_id, branch_id, request_type, subject, description, priority, status,
           offer_no, offer_product, offer_amount, offer_decision)
          VALUES (?, ?, ?, 'Talep', 'Teklif Talebi', ?, 'Orta', 'İnceleniyor', ?, ?, ?, ?)`,
          [body.requestNo, body.customerId || 1, body.branchId || 1,
            body.description || 'Teklif Kontrolü AI Ajanı sonucu oluşturuldu.', body.offerNo,
            body.productName, body.amount, body.decision])
        return json(res, 201, { id: result.insertId, decision: body.decision })
      } catch (err) {
        console.error('Offer decision error:', err.message)
        return json(res, 500, { error: 'Offer decision failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/analysis-reports' && req.method === 'GET') {
      try {
        if (DEMO_MODE) {
          return json(res, 200, [])
        }
        const reports = await query('SELECT id, report_key, title, description, view_name, category FROM analysis_reports WHERE is_active = 1 ORDER BY id')
        const result = await Promise.all(reports.map(async report => ({ ...report, rows: await query(`SELECT * FROM \`${report.view_name}\` LIMIT 50`) })))
        return json(res, 200, result)
      } catch (err) {
        console.error('Analysis reports error:', err.message)
        return json(res, 500, { error: 'Analysis reports query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/field-jobs' && req.method === 'GET') {
      try {
        if (DEMO_MODE) {
          return json(res, 200, sampleFieldJobs)
        }
        const rows = await query(`SELECT fj.id, fj.job_no idCode, fj.team_id teamId, fj.customer_id customerId, fj.title, fj.description, fj.location,
          DATE_FORMAT(fj.scheduled_date, '%d.%m.%Y') date, TIME_FORMAT(fj.scheduled_time, '%H:%i') time,
          fj.status, fj.priority, ft.name team, c.name customer,
          COALESCE(JSON_ARRAYAGG(NULLIF(fji.image_url, '')), JSON_ARRAY()) images
          FROM field_jobs fj JOIN field_teams ft ON ft.id = fj.team_id JOIN customers c ON c.id = fj.customer_id
          LEFT JOIN field_job_images fji ON fji.field_job_id = fj.id
          GROUP BY fj.id ORDER BY fj.scheduled_date, fj.scheduled_time`)
        return json(res, 200, rows)
      } catch (err) {
        console.error('Field jobs error:', err.message)
        return json(res, 500, { error: 'Field jobs query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/field-jobs' && req.method === 'POST') {
      try {
        let raw = ''; for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        if (DEMO_MODE) {
          return json(res, 201, { id: Math.floor(Math.random() * 10000) })
        }
        const date = body.date?.includes('.') ? body.date.split('.').reverse().join('-') : body.date
        const result = await query(`INSERT INTO field_jobs (job_no, team_id, customer_id, created_by, title, description, location, scheduled_date, scheduled_time, status, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [body.jobNo, body.teamId, body.customerId, body.createdBy || null, body.title, body.description, body.location, date, body.time, body.status || 'Planlandı', body.priority || 'Normal'])
        return json(res, 201, { id: result.insertId })
      } catch (err) {
        console.error('Field job creation error:', err.message)
        return json(res, 500, { error: 'Field job creation failed', detail: err.message })
      }
    }
    
    const match = url.pathname.match(/^\/api\/field-jobs\/(\d+)$/)
    if (match && req.method === 'PUT') {
      try {
        if (DEMO_MODE) {
          return json(res, 200, { ok: true })
        }
        let raw = ''; for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        const date = body.date?.includes('.') ? body.date.split('.').reverse().join('-') : body.date
        await query(`UPDATE field_jobs SET title=?, description=?, location=?, scheduled_date=?, scheduled_time=?, status=?, priority=? WHERE id=?`, [body.title, body.description, body.location, date, body.time, body.status, body.priority || 'Normal', match[1]])
        return json(res, 200, { ok: true })
      } catch (err) {
        console.error('Field job update error:', err.message)
        return json(res, 500, { error: 'Field job update failed', detail: err.message })
      }
    }
    
    // Static file serving
    let filePath = path.join(__dirname, 'dist', url.pathname === '/' ? 'index.html' : url.pathname)
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath)
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      }
      return serveFile(res, filePath, contentTypes[ext] || 'application/octet-stream')
    }
    
    // Fallback to index.html for SPA
    if (!url.pathname.startsWith('/api/')) {
      const indexPath = path.join(__dirname, 'dist', 'index.html')
      if (fs.existsSync(indexPath)) {
        return serveFile(res, indexPath, 'text/html')
      }
    }
    
    json(res, 404, { error: 'Endpoint bulunamadı' })
  } catch (error) { 
    console.error('Server error:', error.message)
    json(res, 500, { error: 'İşlem başarısız oldu', detail: error.message })
  }
})

server.listen(Number(process.env.API_PORT || 3001), () => console.log(`🚀 TarımPro API http://0.0.0.0:3001 üzerinde çalışıyor (${DEMO_MODE ? 'Demo Mode' : 'Production Mode'})`))
