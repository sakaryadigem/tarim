import 'dotenv/config'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
})

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(body)) }
const query = async (sql, params = []) => (await pool.query(sql, params))[0]

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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    
    // API routes
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, database: process.env.DB_DATABASE })
    
    if (url.pathname === '/api/dashboard') {
      try {
        const [jobs, teams, customers, completed] = await Promise.all([
          query('SELECT COUNT(*) count FROM field_jobs WHERE scheduled_date = CURDATE()'),
          query('SELECT COUNT(*) count FROM field_teams WHERE is_active = 1'),
          query('SELECT COUNT(*) count FROM customers'),
          query("SELECT COUNT(*) count FROM field_jobs WHERE status = 'Tamamlandı'")
        ])
        return json(res, 200, { todayJobs: jobs[0].count, activeTeams: teams[0].count, customers: customers[0].count, completedJobs: completed[0].count })
      } catch (err) {
        return json(res, 500, { error: 'Dashboard query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/orders' && req.method === 'GET') {
      try {
        const rows = await query(`SELECT o.id, CONCAT('#', o.order_no) idCode, o.customer_id customerId,
          c.name customer, DATE_FORMAT(o.order_date, '%d.%m.%Y %H:%i') date,
          o.total_amount total, o.status, o.shipping_address shippingAddress,
          COALESCE(GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', '), '—') product
          FROM orders o JOIN customers c ON c.id = o.customer_id
          LEFT JOIN order_items oi ON oi.order_id = o.id
          GROUP BY o.id ORDER BY o.order_date DESC`)
        return json(res, 200, rows)
      } catch (err) {
        return json(res, 500, { error: 'Orders query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/complaint-requests' && req.method === 'GET') {
      try {
        const rows = await query(`SELECT cr.id, CONCAT('#', cr.request_no) requestCode, cr.request_type type,
          c.name customer, cr.subject, cr.description, cr.priority, cr.status,
          COALESCE(u.full_name, 'Atanmadı') assignedTo,
          DATE_FORMAT(cr.opened_at, '%d.%m.%Y %H:%i') openedAt
          FROM complaint_requests cr JOIN customers c ON c.id = cr.customer_id
          LEFT JOIN users u ON u.id = cr.assigned_to
          ORDER BY FIELD(cr.status, 'Yeni', 'İnceleniyor', 'Çözüm bekliyor', 'Çözüldü', 'Kapatıldı'), cr.opened_at DESC`)
        return json(res, 200, rows)
      } catch (err) {
        return json(res, 500, { error: 'Complaint requests query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/offer-decisions' && req.method === 'POST') {
      try {
        let raw = ''; for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        const result = await query(`INSERT INTO complaint_requests
          (request_no, customer_id, branch_id, request_type, subject, description, priority, status,
           offer_no, offer_product, offer_amount, offer_decision)
          VALUES (?, ?, ?, 'Talep', 'Teklif Talebi', ?, 'Orta', 'İnceleniyor', ?, ?, ?, ?)`,
          [body.requestNo, body.customerId || 1, body.branchId || 1,
            body.description || 'Teklif Kontrolü AI Ajanı sonucu oluşturuldu.', body.offerNo,
            body.productName, body.amount, body.decision])
        return json(res, 201, { id: result.insertId, decision: body.decision })
      } catch (err) {
        return json(res, 500, { error: 'Offer decision failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/analysis-reports' && req.method === 'GET') {
      try {
        const reports = await query('SELECT id, report_key, title, description, view_name, category FROM analysis_reports WHERE is_active = 1 ORDER BY id')
        const result = await Promise.all(reports.map(async report => ({ ...report, rows: await query(`SELECT * FROM \`${report.view_name}\` LIMIT 50`) })))
        return json(res, 200, result)
      } catch (err) {
        return json(res, 500, { error: 'Analysis reports query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/field-jobs' && req.method === 'GET') {
      try {
        const rows = await query(`SELECT fj.id, fj.job_no idCode, fj.team_id teamId, fj.customer_id customerId, fj.title, fj.description, fj.location,
          DATE_FORMAT(fj.scheduled_date, '%d.%m.%Y') date, TIME_FORMAT(fj.scheduled_time, '%H:%i') time,
          fj.status, fj.priority, ft.name team, c.name customer,
          COALESCE(JSON_ARRAYAGG(NULLIF(fji.image_url, '')), JSON_ARRAY()) images
          FROM field_jobs fj JOIN field_teams ft ON ft.id = fj.team_id JOIN customers c ON c.id = fj.customer_id
          LEFT JOIN field_job_images fji ON fji.field_job_id = fj.id
          GROUP BY fj.id ORDER BY fj.scheduled_date, fj.scheduled_time`)
        return json(res, 200, rows)
      } catch (err) {
        return json(res, 500, { error: 'Field jobs query failed', detail: err.message })
      }
    }
    
    if (url.pathname === '/api/field-jobs' && req.method === 'POST') {
      try {
        let raw = ''; for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        const date = body.date?.includes('.') ? body.date.split('.').reverse().join('-') : body.date
        const result = await query(`INSERT INTO field_jobs (job_no, team_id, customer_id, created_by, title, description, location, scheduled_date, scheduled_time, status, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [body.jobNo, body.teamId, body.customerId, body.createdBy || null, body.title, body.description, body.location, date, body.time, body.status || 'Planlandı', body.priority || 'Normal'])
        return json(res, 201, { id: result.insertId })
      } catch (err) {
        return json(res, 500, { error: 'Field job creation failed', detail: err.message })
      }
    }
    
    const match = url.pathname.match(/^\/api\/field-jobs\/(\d+)$/)
    if (match && req.method === 'PUT') {
      try {
        let raw = ''; for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        const date = body.date?.includes('.') ? body.date.split('.').reverse().join('-') : body.date
        await query(`UPDATE field_jobs SET title=?, description=?, location=?, scheduled_date=?, scheduled_time=?, status=?, priority=? WHERE id=?`, [body.title, body.description, body.location, date, body.time, body.status, body.priority || 'Normal', match[1]])
        return json(res, 200, { ok: true })
      } catch (err) {
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
    console.error(error)
    json(res, 500, { error: 'Veritabanı işlemi başarısız oldu', detail: error.message })
  }
})

server.listen(Number(process.env.API_PORT || 3001), () => console.log('TarımPro API http://0.0.0.0:3001 üzerinde çalışıyor'))
