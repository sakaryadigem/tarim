import { StrictMode, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Bot, Boxes, Building2, ChevronDown, ChevronRight,
  ClipboardCheck, ClipboardList, Clock3, Cog, Crown, FileText, Gauge, Headphones, LayoutDashboard, Mail, MapPin,
  Menu, MoreHorizontal, Package, Play, Plus, Search, Settings, ShieldCheck, ShoppingCart, SlidersHorizontal, Truck,
  Users, Wrench, X, CheckCircle2, RotateCcw, ImageIcon, Share2
} from 'lucide-react'
import './styles.css'

type Icon = typeof LayoutDashboard

type FieldJob = {
  id: string
  dbId?: number
  teamId?: number
  customerId?: number
  title: string
  team: string
  location: string
  date: string
  time: string
  status: string
  description: string
  images: string[]
}

const initialFieldJobs: FieldJob[] = [
  { id: 'SF-0241', dbId: 1, teamId: 1, customerId: 1, title: 'Periyodik bakım', team: 'Ekip A — Ali K.', location: 'Çumra / Konya', date: '18 Haziran 2025', time: '10:30', status: 'Planlandı', description: 'Müşterinin Massey Ferguson 5710S traktöründe 500 saatlik periyodik bakım yapılacak. Motor yağı, filtreler ve hidrolik sistem kontrol edilecek.', images: ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=900&q=80'] },
  { id: 'SF-0240', title: 'Arıza tespiti', team: 'Ekip C — Burak T.', location: 'Meram / Konya', date: '18 Haziran 2025', time: '11:15', status: 'Devam ediyor', description: 'Hidrolik kaldırma sistemindeki güç kaybı için sahada arıza tespiti yapılacak. Gerekli yedek parçalar ekip aracına yüklendi.', images: ['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80'] },
  { id: 'SF-0239', title: 'Teslimat', team: 'Ekip B — Can Y.', location: 'Karatay / Konya', date: '18 Haziran 2025', time: '13:00', status: 'Bekliyor', description: 'Yeni sipariş edilen hidrolik pompa ve montaj kitinin müşteriye teslimatı. Teslim tutanağı imzalanacak ve ürün fotoğrafları kaydedilecek.', images: ['https://images.unsplash.com/photo-1586528116493-da8b0f0c7f43?auto=format&fit=crop&w=900&q=80'] },
]

const menu: { label: string; icon: Icon; badge?: string }[] = [
  { label: 'Genel Bakış', icon: LayoutDashboard }, { label: 'Markalar', icon: Crown }, { label: 'Ürünler', icon: Package },
  { label: 'Stok Takibi', icon: Boxes, badge: '12' }, { label: 'Müşteriler', icon: Users }, { label: 'Siparişler', icon: ShoppingCart, badge: '8' },
  { label: 'Tamir-Bakım', icon: Wrench, badge: '5' }, { label: 'Şikayet-Talep', icon: Headphones, badge: '3' }, { label: 'Depolar', icon: Building2 },
  { label: 'Saha İşleri', icon: MapPin }, { label: 'Analiz & Raporlama', icon: BarChart3 }, { label: 'Yapay Zeka Ajanları', icon: Bot }, { label: 'Şubeler', icon: Truck }, { label: 'Kullanıcı Yönetimi', icon: ShieldCheck }
]

const stats = [
  { title: 'Toplam Satış', value: '₺ 428.650', change: '+12,8%', note: 'geçen aya göre', icon: ShoppingCart, color: 'red' },
  { title: 'Aktif Siparişler', value: '86', change: '+8,4%', note: 'geçen haftaya göre', icon: ClipboardList, color: 'green' },
  { title: 'Servis Talepleri', value: '24', change: '-3,2%', note: 'geçen aya göre', icon: Wrench, color: 'orange' },
  { title: 'Kritik Stok', value: '12', change: '+2', note: 'ürün yeniden sipariş bekliyor', icon: AlertCircle, color: 'purple' },
]

const orders = [
  { id: '#SP-1048', customer: 'Yıldız Tarım A.Ş.', product: 'Massey Ferguson 5710S', date: 'Bugün, 09:42', total: '₺ 84.500', status: 'Hazırlanıyor', tone: 'yellow' },
  { id: '#SP-1047', customer: 'Ahmet Öztürk', product: 'Hidrolik Pompa — 3226', date: 'Bugün, 09:15', total: '₺ 12.850', status: 'Ödeme Alındı', tone: 'blue' },
  { id: '#SP-1046', customer: 'Bereket Kooperatifi', product: 'John Deere 5075E', date: 'Dün, 16:38', total: '₺ 56.200', status: 'Tamamlandı', tone: 'green' },
  { id: '#SP-1045', customer: 'Karaoğlu Çiftliği', product: 'Debriyaj Seti — 8450', date: 'Dün, 14:20', total: '₺ 8.460', status: 'Kargoda', tone: 'purple' },
]

const moduleDetails: Record<string, { description: string; stats: [string, string][]; columns: string[]; rows: string[][] }> = {
  'Markalar': { description: 'Makine ve yedek parça markalarını yönetin.', stats: [['Aktif marka', '24'], ['Ürün bağlantısı', '486'], ['Bekleyen onay', '3']], columns: ['MARKA', 'ÜRÜN SAYISI', 'DURUM', 'SON GÜNCELLEME'], rows: [['Massey Ferguson', '86 ürün', 'Aktif', 'Bugün, 10:24'], ['John Deere', '72 ürün', 'Aktif', 'Dün, 16:40'], ['New Holland', '64 ürün', 'Aktif', 'Dün, 14:12']] },
  'Ürünler': { description: 'Marka, model ve parça kataloğunuzu yönetin.', stats: [['Toplam ürün', '1.248'], ['Aktif ürün', '1.186'], ['Taslak', '62']], columns: ['ÜRÜN / PARÇA', 'MARKA', 'KATEGORİ', 'STOK'], rows: [['Hidrolik Pompa — 3226', 'Massey Ferguson', 'Yedek Parça', '24 adet'], ['Debriyaj Seti — 8450', 'John Deere', 'Yedek Parça', '8 adet'], ['Traktör 5710S', 'Massey Ferguson', 'Traktör', '3 adet']] },
  'Stok Takibi': { description: 'Depo bazlı stok seviyelerini ve kritik ürünleri izleyin.', stats: [['Toplam stok', '₺ 2,4M'], ['Kritik ürün', '12'], ['Depo doluluk', '%78']], columns: ['ÜRÜN', 'DEPO', 'MEVCUT', 'DURUM'], rows: [['Debriyaj Seti — 8450', 'Merkez Depo', '8 adet', 'Kritik'], ['Yağ Filtresi — 2656', 'Ankara Depo', '14 adet', 'Düşük'], ['Hidrolik Pompa — 3226', 'Merkez Depo', '24 adet', 'Yeterli']] },
  'Müşteriler': { description: 'Müşteri kayıtlarını, iletişim ve satış geçmişini yönetin.', stats: [['Toplam müşteri', '842'], ['Bu ay eklenen', '28'], ['Kurumsal müşteri', '214']], columns: ['MÜŞTERİ', 'MÜŞTERİ TÜRÜ', 'TELEFON', 'SON İŞLEM'], rows: [['Yıldız Tarım A.Ş.', 'Kurumsal', '0532 421 18 24', 'Bugün, 09:42'], ['Ahmet Öztürk', 'Bireysel', '0541 288 67 10', 'Bugün, 09:15'], ['Bereket Kooperatifi', 'Kurumsal', '0382 214 90 12', 'Dün, 16:38']] },
  'Siparişler': { description: 'Satış siparişlerini, ödemeleri ve teslimatları takip edin.', stats: [['Toplam sipariş', '1.426'], ['Hazırlanıyor', '18'], ['Bu ay ciro', '₺ 428.650']], columns: ['SİPARİŞ NO', 'MÜŞTERİ', 'TUTAR', 'DURUM'], rows: orders.map(o => [o.id, o.customer, o.total, o.status]) },
  'Tamir-Bakım': { description: 'Servis, bakım ve tamir taleplerini ekiplerle planlayın.', stats: [['Açık servis', '24'], ['Bugün planlanan', '8'], ['Tamamlanan', '156']], columns: ['SERVİS NO', 'MÜŞTERİ', 'İŞLEM', 'DURUM'], rows: [['#SR-2084', 'Karaoğlu Çiftliği', 'Periyodik bakım', 'Ekip atandı'], ['#SR-2083', 'Yıldız Tarım A.Ş.', 'Hidrolik arıza', 'İnceleniyor'], ['#SR-2082', 'Mehmet Demir', 'Motor bakımı', 'Tamamlandı']] },
  'Şikayet-Talep': { description: 'Müşteri geri bildirimlerini ve talepleri sonuçlandırın.', stats: [['Açık talepler', '3'], ['Çözüm bekleyen', '7'], ['Çözüm oranı', '%94']], columns: ['TALEP NO', 'MÜŞTERİ', 'KONU', 'ÖNCELİK'], rows: [['#TK-083', 'Ahmet Öztürk', 'Teslimat gecikmesi', 'Yüksek'], ['#TK-082', 'Bereket Kooperatifi', 'Parça değişimi', 'Orta'], ['#TK-081', 'Karaoğlu Çiftliği', 'Teklif talebi', 'Düşük']] },
  'Depolar': { description: 'Depolarınızı ve depo hareketlerini tek ekrandan izleyin.', stats: [['Aktif depo', '4'], ['Toplam kapasite', '₺ 5,8M'], ['Doluluk', '%64']], columns: ['DEPO', 'KONUM', 'ÜRÜN ÇEŞİDİ', 'DOLULUK'], rows: [['Merkez Depo', 'Konya', '284 ürün', '%78'], ['Ankara Depo', 'Ankara', '192 ürün', '%54'], ['İzmir Depo', 'İzmir', '146 ürün', '%43']] },
  'Saha İşleri': { description: 'Saha ekiplerinin günlük görevlerini planlayın ve izleyin.', stats: [['Bugünkü işler', '14'], ['Aktif ekip', '8'], ['Tamamlanma', '%72']], columns: ['GÖREV', 'EKİP', 'KONUM', 'SAAT'], rows: [['Periyodik bakım', 'Ekip A — Ali K.', 'Çumra / Konya', '10:30'], ['Arıza tespiti', 'Ekip C — Burak T.', 'Meram / Konya', '11:15'], ['Teslimat', 'Ekip B — Can Y.', 'Karatay / Konya', '13:00']] },
  'Şubeler': { description: 'Şubelerinizi, performanslarını ve stok durumlarını yönetin.', stats: [['Toplam şube', '6'], ['Aktif personel', '42'], ['Bu ay satış', '₺ 1,2M']], columns: ['ŞUBE', 'SORUMLU', 'PERSONEL', 'DURUM'], rows: [['Merkez Şube', 'Selim Aksoy', '18 kişi', 'Açık'], ['Ankara Şube', 'Ece Yıldırım', '12 kişi', 'Açık'], ['İzmir Şube', 'Murat Kaya', '8 kişi', 'Açık']] },
  'Kullanıcı Yönetimi': { description: 'Panel kullanıcılarını ve yetki gruplarını yönetin.', stats: [['Toplam kullanıcı', '42'], ['Aktif kullanıcı', '38'], ['Yetki grubu', '5']], columns: ['KULLANICI', 'ROL', 'ŞUBE', 'SON GİRİŞ'], rows: [['Selim Aksoy', 'Yönetici', 'Merkez Şube', 'Şimdi'], ['Ece Yıldırım', 'Satış Uzmanı', 'Ankara Şube', '12 dk önce'], ['Murat Kaya', 'Servis Sorumlusu', 'İzmir Şube', '1 saat önce']] },
}

function FieldJobsView({ search }: { search: string }) {
  const [jobs, setJobs] = useState(initialFieldJobs)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<FieldJob | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<FieldJob>(initialFieldJobs[0])
  const [loadError, setLoadError] = useState('')
  useEffect(() => { fetch('/api/field-jobs').then(response => { if (!response.ok) throw new Error('API yanıt vermedi'); return response.json() }).then(rows => setJobs(rows.map((row: any) => { let images = row.images; if (typeof images === 'string') { try { images = JSON.parse(images) } catch { images = [] } } return { id: row.idCode, dbId: row.id, teamId: row.teamId || 1, customerId: row.customerId || 1, title: row.title, team: row.team, location: row.location, date: row.date, time: row.time, status: row.status, description: row.description, images: Array.isArray(images) ? images.filter(Boolean) : [] } }))).catch(() => setLoadError('Veritabanı bağlantısı kurulamadı; demo kayıtlar gösteriliyor.')) }, [])
  const filtered = jobs.filter(job => Object.values(job).join(' ').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
  const openForm = (job?: FieldJob) => { const nextForm = job ? { ...job } : { id: `SF-${String(jobs.length + 242).padStart(4, '0')}`, teamId: 1, customerId: 1, title: '', team: '', location: '', date: '', time: '', status: 'Planlandı', description: '', images: [] }; setIsNew(!job); setForm(nextForm); setEditing(nextForm) }
  const save = async (event: FormEvent) => { event.preventDefault(); const payload = { jobNo: form.id, teamId: form.teamId || 1, customerId: form.customerId || 1, title: form.title, description: form.description, location: form.location, date: form.date, time: form.time, status: form.status }; const response = await fetch(isNew ? '/api/field-jobs' : `/api/field-jobs/${form.dbId}`, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) { setLoadError('Kayıt veritabanına yazılamadı.'); return } if (isNew) { const result = await response.json(); setJobs(current => [{ ...form, dbId: result.id }, ...current]) } else setJobs(current => current.map(job => job.id === form.id ? form : job)); setEditing(null) }
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> MODÜL YÖNETİMİ</div><h1>Saha İşleri</h1><p>Saha ekiplerinin günlük görevlerini planlayın ve izleyin.</p>{loadError && <div className="db-warning">{loadError}</div>}</div><button className="primary" onClick={() => openForm()}><Plus size={18}/> Yeni kayıt</button></div>
    <section className="module-stats"><div className="module-stat"><span>Bugünkü işler</span><strong>{jobs.length}</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div><div className="module-stat"><span>Aktif ekip</span><strong>8</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div><div className="module-stat"><span>Tamamlanma</span><strong>%72</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div></section>
    <section className="panel module-table"><div className="module-toolbar"><div><h2>Saha işleri kayıtları</h2><p>{filtered.length} kayıt gösteriliyor</p></div><div className="toolbar-actions"><button><SlidersHorizontal size={15}/> Filtrele</button><button className="primary" onClick={() => openForm()}><Plus size={15}/> Yeni kayıt</button></div></div><div className="table-wrap"><table><thead><tr><th>GÖREV</th><th>EKİP</th><th>KONUM</th><th>TARİH</th><th>SAAT</th><th>DURUM</th><th></th></tr></thead><tbody>{filtered.map(job => <tr key={job.id} className={expanded === job.id ? 'job-row expanded' : 'job-row'} onMouseEnter={() => setExpanded(job.id)} onMouseLeave={() => setExpanded(null)}><td><b className="order-id">{job.title}</b><small className="job-id">{job.id}</small>{expanded === job.id && <div className="row-description"><b>Görev açıklaması</b><span>{job.description}</span></div>}</td><td>{job.team}</td><td>{job.location}</td><td className="muted">{job.date}</td><td>{job.time}</td><td><span className="status green"><i/> {job.status}</span></td><td><button className="edit-btn" onClick={() => openForm(job)} aria-label={`${job.title} kaydını düzenle`}><FileText size={15}/> Düzenle</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="empty-state">Aramanızla eşleşen kayıt bulunamadı.</td></tr>}</tbody></table></div></section>
    <div className="module-tip"><ShieldCheck size={18}/><div><b>İşlemleriniz kayıt altında</b><span>Bu modüldeki değişiklikler kullanıcı hareketleri geçmişine otomatik olarak eklenir.</span></div></div>
    {editing && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEditing(null)}><div className="job-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><div className="eyebrow">SAHA İŞİ KAYDI</div><h2>{isNew ? 'Yeni saha işi' : 'Saha işini güncelle'}</h2><p>Görev detaylarını ve görsellerini yönetin.</p></div><button onClick={() => setEditing(null)} aria-label="Kapat"><X size={19}/></button></div><form onSubmit={save}><div className="form-grid"><label>Görev adı<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Örn. Periyodik bakım" /></label><label>Ekip<input required value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} placeholder="Örn. Ekip A — Ali K." /></label><label>Konum<input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="İlçe / İl" /></label><label>Tarih<input required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="18 Haziran 2025" /></label><label>Saat<input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label><label>Durum<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Planlandı</option><option>Devam ediyor</option><option>Bekliyor</option><option>Tamamlandı</option></select></label></div><label className="full-label">Görev detayları<textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Sahada yapılacak işlemleri açıklayın..." /></label><div className="form-images"><div className="form-section-title">Görev görselleri <span>{form.images.length} görsel</span></div><div className="image-grid">{form.images.map((image, index) => <img key={image} src={image} alt={`${form.title} görseli ${index + 1}`} />)}{form.images.length === 0 && <div className="no-images">Bu kayıt için henüz görsel eklenmemiş.</div>}</div></div><div className="modal-actions"><button type="button" className="cancel-btn" onClick={() => setEditing(null)}>Vazgeç</button><button className="primary" type="submit"><CheckCircle2 size={16}/> {isNew ? 'Kaydı oluştur' : 'Değişiklikleri kaydet'}</button></div></form></div></div>}
  </>
}

type Report = { id: number; title: string; description: string; category: string; view_name: string; rows: Record<string, unknown>[] }

function ReportsView() {
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/analysis-reports').then(response => { if (!response.ok) throw new Error(); return response.json() }).then(data => { setReports(data); setSelected(data[0] || null) }).catch(() => setError('Analiz raporları veritabanından yüklenemedi.')) }, [])
  const columns = selected?.rows[0] ? Object.keys(selected.rows[0]) : []
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> RAPORLAMA MERKEZİ</div><h1>Analiz &amp; Raporlama</h1><p>Operasyon verilerinizi hazır raporlarla inceleyin.</p>{error && <div className="db-warning">{error}</div>}</div></div>
    <div className="reports-layout"><section className="panel report-list"><div className="report-list-head"><h2>Raporlar</h2><span>{reports.length} hazır rapor</span></div>{reports.map(report => <button key={report.id} className={selected?.id === report.id ? 'report-item selected' : 'report-item'} onClick={() => setSelected(report)}><div className="report-icon"><BarChart3 size={16}/></div><div><b>{report.title}</b><span>{report.category}</span></div><ChevronRight size={15}/></button>)}</section><section className="panel report-content">{selected ? <><div className="report-content-head"><div><div className="eyebrow">{selected.category.toUpperCase()}</div><h2>{selected.title}</h2><p>{selected.description}</p></div><span className="view-badge">{selected.view_name}</span></div><div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column}>{column.replace(/_/g, ' ')}</th>)}</tr></thead><tbody>{selected.rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column}>{String(row[column] ?? '—')}</td>)}</tr>)}{selected.rows.length === 0 && <tr><td colSpan={Math.max(columns.length, 1)} className="empty-state">Bu rapor için veri bulunamadı.</td></tr>}</tbody></table></div></> : <div className="empty-state">Rapor seçin.</div>}</section></div>
  </>
}

const offerAgentSteps = [
  { title: 'Teklif alındı', detail: 'Yeni teklif kaydı işleme alındı.', icon: FileText, tone: 'neutral' },
  { title: 'AI ajan teklif kontrolü', detail: 'Teklif kalemleri ve tolerans bilgileri karşılaştırılıyor.', icon: Bot, tone: 'agent' },
  { title: 'Tolerans kontrolü', detail: 'Teklif kabul edildi mi?', icon: Gauge, tone: 'decision' },
]

function OfferAgentView() {
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [accepted, setAccepted] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [databaseMessage, setDatabaseMessage] = useState('')
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setStep(current => { if (current >= offerAgentSteps.length + 1) { window.clearInterval(timer); setRunning(false); return current } return current + 1 }), 850); return () => window.clearInterval(timer) }, [running])
  const finished = step > offerAgentSteps.length
  useEffect(() => {
    if (!finished || accepted === null || submitted) return
    setSubmitted(true)
    fetch('/api/offer-decisions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestNo: `TK-AI-${Date.now().toString().slice(-6)}`, offerNo: `TK-AI-${Date.now().toString().slice(-6)}`, customerId: 1, branchId: 1, productName: 'AI ajan teklif kalemi', amount: 10000, decision: accepted ? 'Onaylandı' : 'Reddedildi' }) })
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(() => setDatabaseMessage(accepted ? 'Onaylanan teklif orders tablosuna otomatik kaydedildi.' : 'Reddedilen teklif complaint_requests tablosuna otomatik kaydedildi.'))
      .catch(() => setDatabaseMessage('Karar üretildi ancak veritabanı otomasyonu çalıştırılamadı.'))
  }, [finished, accepted, submitted])
  const runAgent = () => { setAccepted(Math.random() >= 0.5); setSubmitted(false); setDatabaseMessage(''); setStep(0); setRunning(true) }
  const reset = () => { setRunning(false); setStep(-1); setAccepted(null); setSubmitted(false); setDatabaseMessage('') }
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> YAPAY ZEKA AJANLARI</div><h1>Teklif Kontrolü</h1><p>Teklifleri tolerans bilgileriyle karşılaştıran örnek AI ajan akışı.</p></div><button className="primary" onClick={runAgent} disabled={running}><Play size={17}/> {running ? 'Ajan çalışıyor...' : 'Ajanı çalıştır'}</button></div>
    <section className="agent-hero panel"><div className="agent-hero-icon"><Bot size={25}/></div><div><h2>Teklif Kontrolü AI Ajanı</h2><p>Butona bastığınızda teklif kontrolü otomatik olarak başlar ve örnek bir sonuç rastgele üretilir.</p></div><div className={running ? 'agent-status running' : finished ? 'agent-status done' : 'agent-status'}><i/>{running ? 'Çalışıyor' : finished ? 'Tamamlandı' : 'Hazır'}</div></section>
    <section className="agent-flow panel"><div className="panel-head"><div><h2>İş akışı</h2><p>Ekli süreç diyagramındaki adımların canlı simülasyonu</p></div>{finished && <button className="text-btn" onClick={reset}><RotateCcw size={14}/> Sıfırla</button>}</div><div className="agent-timeline">{offerAgentSteps.map((item, index) => { const StepIcon = item.icon; const activeStep = step >= index; return <div key={item.title} className={activeStep ? `agent-step active ${item.tone}` : 'agent-step'}><div className="agent-step-marker"><StepIcon size={17}/></div><div><b>{item.title}</b><span>{item.detail}</span>{index === 1 && activeStep && <small>Teklif kalemleri analiz ediliyor...</small>}{index === 2 && activeStep && <small>{accepted === null ? 'Karar hazırlanıyor...' : accepted ? 'Tolerans içinde: Evet' : 'Tolerans dışında: Hayır'}</small>}</div></div> })}<div className={step >= 3 ? `agent-branches active ${accepted ? 'accepted' : 'rejected'}` : 'agent-branches'}><div className="agent-branch"><div className="branch-label">Evet</div><div className="agent-step-marker"><CheckCircle2 size={17}/></div><div><b>Onay e-postası oluştur</b><span>Şablona göre mesaj hazırlanır</span></div><div className="agent-result"><Mail size={15}/> E-posta gönderilir</div><div className="agent-result"><ShoppingCart size={15}/> Otomatik sipariş oluşturulur</div></div><div className="agent-branch"><div className="branch-label">Hayır</div><div className="agent-step-marker"><X size={17}/></div><div><b>Red e-postası oluştur</b><span>Şablona göre mesaj hazırlanır</span></div><div className="agent-result"><Mail size={15}/> E-posta gönderilir</div><div className="agent-result"><ClipboardCheck size={15}/> Revizyon talebi işi açılır</div></div></div></div></section>
    <div className="module-tip"><Bot size={18}/><div><b>Veritabanı otomasyonu aktif</b><span>Onaylanan teklif orders/order_items tablolarına, reddedilen teklif ise trigger üzerinden complaint_requests tablosuna yazılır.</span>{databaseMessage && <small>{databaseMessage}</small>}</div></div>
  </>
}

type SocialMediaType = 'Medya postu' | 'Durum' | 'Video İçeriği' | 'Görsel'

const socialMediaTypes: { key: SocialMediaType; icon: Icon; hint: string }[] = [
  { key: 'Medya postu', icon: ClipboardList, hint: 'Instagram, Facebook, X ve LinkedIn için metin + etiket önerisi' },
  { key: 'Durum', icon: Clock3, hint: '24 saat geçerli kısa durum paylaşımı' },
  { key: 'Video İçeriği', icon: Play, hint: '1 dakikalık video senaryosu ve sahne akışı' },
  { key: 'Görsel', icon: ImageIcon, hint: 'Paylaşılmaya hazır görsel üretim açıklaması' },
]

function SocialMediaAgentView() {
  const [type, setType] = useState<SocialMediaType>('Medya postu')
  const [prompt, setPrompt] = useState('Yeni sezon traktör bakım kampanyamız için Konya bölgesine uygun, samimi bir içerik hazırla.')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [generated, setGenerated] = useState(false)
  const [shared, setShared] = useState<string | null>(null)
  const selectedType = socialMediaTypes.find(item => item.key === type) || socialMediaTypes[0]
  const finished = step >= 4
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setStep(current => {
      if (current >= 3) { window.clearInterval(timer); setRunning(false); setGenerated(true); return 4 }
      return current + 1
    }), 700)
    return () => window.clearInterval(timer)
  }, [running])
  const generate = (event: FormEvent) => { event.preventDefault(); if (!prompt.trim()) return; setGenerated(false); setShared(null); setStep(0); setRunning(true) }
  const reset = () => { setGenerated(false); setShared(null); setStep(-1) }
  const output = type === 'Video İçeriği'
    ? `Sahne 1 (0–10 sn): ${prompt}\nSahne 2 (10–40 sn): Ürün ve kullanım avantajları yakın plan gösterilir.\nSahne 3 (40–60 sn): Kampanya çağrısı ve iletişim bilgileri.`
    : type === 'Görsel'
      ? `Üretim promptu: ${prompt}\nGörsel stili: doğal ışık, tarım arazisi, kurumsal ama sıcak marka dili.`
      : `${prompt}\n\nTarımPro ile işinizi kolaylaştırın. Detaylı bilgi için bize ulaşın.\n#TarımPro #TarımMakinaları #Konya`
  const outputImage = type === 'Video İçeriği' ? '/images/video.jpg' : '/images/resim.jpg'
  return <div className="social-agent-wrap">
    <div className="social-tabs">{socialMediaTypes.map(item => { const ItemIcon = item.icon; return <button key={item.key} className={type === item.key ? 'social-tab active' : 'social-tab'} onClick={() => { setType(item.key); reset() }}><ItemIcon size={17}/><span>{item.key}</span></button> })}</div>
    <div className="social-agent-grid"><form className="social-prompt panel" onSubmit={generate}><div className="panel-head"><div><h2>{type} üret</h2><p>{selectedType.hint}</p></div><Bot size={20}/></div><label>İçerik promptu<textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={7} placeholder="Örn. Hasat dönemine özel kampanyamızı anlatan enerjik bir içerik hazırla..." /></label><div className="prompt-foot"><small><Bot size={14}/> AI ajanı promptunuzu analiz ederek içerik taslağı oluşturur.</small><button className="primary" type="submit" disabled={running}><Play size={16}/> {running ? 'Üretiliyor...' : 'Üretmeye başla'}</button></div></form><section className="social-process panel"><div className="panel-head"><div><h2>Ajan akışı</h2><p>İçerik sırasıyla hazırlanıyor</p></div>{finished && <button className="text-btn" onClick={reset}><RotateCcw size={14}/> Sıfırla</button>}</div><div className="social-steps">{['Prompt analiz ediliyor', 'Marka dili ve kanal seçiliyor', `${type} taslağı hazırlanıyor`, 'Son kontroller yapılıyor'].map((label, index) => <div key={label} className={step >= index ? 'social-step active' : 'social-step'}><div className="social-step-dot">{step > index ? <CheckCircle2 size={15}/> : index + 1}</div><span>{label}</span></div>)}</div>{generated && <div className="social-output"><div className="output-label"><span>DEMO ÇIKTI</span><small>{type === 'Durum' ? '24 saat geçerli' : type === 'Video İçeriği' ? '1 dakika' : 'Taslak hazır'}</small></div><img className="social-output-image" src={outputImage} alt={`${type} demo çıktısı`} />{type === 'Video İçeriği' && <span className="video-preview-badge"><Play size={13}/> 1:00 demo video önizlemesi</span>}<pre>{output}</pre></div>}</section></div>
    {generated && <section className="social-share panel"><div className="panel-head"><div><h2>Paylaş</h2><p>Üretilen demo çıktıyı seçtiğiniz sosyal medya hesabına gönderin.</p></div><Share2 size={20}/></div><div className="share-list">{['Facebook', 'X', 'Instagram', 'LinkedIn', 'YouTube'].map(account => <button key={account} onClick={() => setShared(account)} className={shared === account ? 'share-account shared' : 'share-account'}><span className="account-mark">{account === 'X' ? '𝕏' : account.slice(0, 1)}</span><b>{account}</b><span>{shared === account ? 'Paylaşıldı' : 'Paylaş'}</span><ChevronRight size={15}/></button>)}</div></section>}
  </div>
}

const aiAgents = [
  { key: 'Teklif Kontrolü AI Ajanı', description: 'Teklifleri tolerans bilgileriyle karşılaştırır; onay veya red sonucuna göre veritabanı aksiyonunu başlatır.', category: 'Satış Operasyonları', icon: ClipboardCheck },
  { key: 'Sosyal Medya İçeriği Üret', description: 'Promptunuzu analiz ederek farklı sosyal medya kanalları için metin, durum, video senaryosu veya görsel üretim taslağı hazırlar.', category: 'Pazarlama Operasyonları', icon: ImageIcon },
]

function AIAgentsView() {
  const [selectedKey, setSelectedKey] = useState(aiAgents[0].key)
  const selected = aiAgents.find(agent => agent.key === selectedKey) || aiAgents[0]
  const AgentIcon = selected.icon
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> YAPAY ZEKA MERKEZİ</div><h1>Yapay Zeka Ajanları</h1><p>İş süreçlerinizi otomatikleştiren ajanları tek merkezden çalıştırın ve yönetin.</p></div></div>
    <div className="reports-layout"><section className="panel report-list"><div className="report-list-head"><h2>Ajanlar</h2><span>{aiAgents.length} aktif ajan</span></div>{aiAgents.map(agent => { const ItemIcon = agent.icon; return <button key={agent.key} className={selected.key === agent.key ? 'report-item selected' : 'report-item'} onClick={() => setSelectedKey(agent.key)}><div className="report-icon"><ItemIcon size={16}/></div><div><b>{agent.key}</b><span>{agent.category}</span></div><ChevronRight size={15}/></button> })}</section><section className="panel report-content"><div className="report-content-head"><div><div className="eyebrow">{selected.category.toUpperCase()}</div><h2><AgentIcon size={22}/> {selected.key}</h2><p>{selected.description}</p></div><span className="view-badge">AKTİF AJAN</span></div>{selected.key === 'Sosyal Medya İçeriği Üret' ? <SocialMediaAgentView /> : <OfferAgentView />}</section></div>
  </>
}

type DbOrder = { id: number; idCode: string; customer: string; product: string; date: string; total: number; status: string; shippingAddress?: string }
type ComplaintRequest = { id: number; requestCode: string; type: string; customer: string; subject: string; description: string; priority: string; status: string; assignedTo: string; openedAt: string }

const money = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(value))
const statusTone = (value: string) => value === 'Tamamlandı' || value === 'Çözüldü' || value === 'Kapatıldı' ? 'green' : value === 'Hazırlanıyor' || value === 'Çözüm bekliyor' ? 'yellow' : value === 'Yüksek' || value === 'Acil' ? 'red' : 'blue'

function OrdersView({ search }: { search: string }) {
  const [rows, setRows] = useState<DbOrder[]>([])
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/orders').then(response => { if (!response.ok) throw new Error(); return response.json() }).then(setRows).catch(() => setError('Siparişler veritabanından yüklenemedi.')) }, [])
  const filtered = rows.filter(row => Object.values(row).join(' ').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
  const revenue = rows.reduce((sum, row) => sum + Number(row.total), 0)
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> VERİTABANI MODÜLÜ</div><h1>Siparişler</h1><p>Satış siparişleri, ödemeler ve teslimatlar doğrudan veritabanından yüklenir.</p>{error && <div className="db-warning">{error}</div>}</div><button className="primary" onClick={() => setError('Yeni sipariş formu yakında kullanılabilir olacak.')}><Plus size={18}/> Yeni sipariş</button></div>
    <section className="module-stats"><div className="module-stat"><span>Toplam sipariş</span><strong>{rows.length}</strong><small><ArrowUpRight size={13}/> Veritabanı</small></div><div className="module-stat"><span>Hazırlanıyor</span><strong>{rows.filter(row => row.status === 'Hazırlanıyor').length}</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div><div className="module-stat"><span>Toplam ciro</span><strong>{money(revenue)}</strong><small><ArrowUpRight size={13}/> Yüklenen kayıtlar</small></div></section>
    <section className="panel module-table"><div className="module-toolbar"><div><h2>Sipariş kayıtları</h2><p>{filtered.length} kayıt gösteriliyor</p></div><div className="toolbar-actions"><button><SlidersHorizontal size={15}/> Filtrele</button></div></div><div className="table-wrap"><table><thead><tr><th>SİPARİŞ NO</th><th>MÜŞTERİ</th><th>ÜRÜN / KALEM</th><th>TARİH</th><th>TUTAR</th><th>DURUM</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><b className="order-id">{row.idCode}</b></td><td>{row.customer}</td><td>{row.product}</td><td className="muted">{row.date}</td><td><b>{money(row.total)}</b></td><td><span className={`status ${statusTone(row.status)}`}><i/> {row.status}</span></td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="empty-state">Veritabanında eşleşen sipariş bulunamadı.</td></tr>}</tbody></table></div></section>
    <div className="module-tip"><ShoppingCart size={18}/><div><b>Canlı sipariş verisi</b><span>Bu liste orders ve order_items tablolarındaki kayıtların birleşiminden oluşturulur.</span></div></div>
  </>
}

function ComplaintsView({ search }: { search: string }) {
  const [rows, setRows] = useState<ComplaintRequest[]>([])
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/complaint-requests').then(response => { if (!response.ok) throw new Error(); return response.json() }).then(setRows).catch(() => setError('Şikayet ve talepler veritabanından yüklenemedi.')) }, [])
  const filtered = rows.filter(row => Object.values(row).join(' ').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> VERİTABANI MODÜLÜ</div><h1>Şikayet-Talep</h1><p>Müşteri geri bildirimlerini ve taleplerini veritabanından takip edin.</p>{error && <div className="db-warning">{error}</div>}</div><button className="primary" onClick={() => setError('Yeni talep formu yakında kullanılabilir olacak.')}><Plus size={18}/> Yeni kayıt</button></div>
    <section className="module-stats"><div className="module-stat"><span>Açık kayıt</span><strong>{rows.filter(row => !['Çözüldü', 'Kapatıldı'].includes(row.status)).length}</strong><small><ArrowUpRight size={13}/> Veritabanı</small></div><div className="module-stat"><span>Yüksek öncelik</span><strong>{rows.filter(row => ['Yüksek', 'Acil'].includes(row.priority)).length}</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div><div className="module-stat"><span>Çözülen</span><strong>{rows.filter(row => ['Çözüldü', 'Kapatıldı'].includes(row.status)).length}</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div></section>
    <section className="panel module-table"><div className="module-toolbar"><div><h2>Şikayet ve talep kayıtları</h2><p>{filtered.length} kayıt gösteriliyor</p></div><div className="toolbar-actions"><button><SlidersHorizontal size={15}/> Filtrele</button></div></div><div className="table-wrap"><table><thead><tr><th>TALEP NO</th><th>TÜR</th><th>MÜŞTERİ</th><th>KONU</th><th>ÖNCELİK</th><th>DURUM</th><th>ATANAN</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><b className="order-id">{row.requestCode}</b></td><td>{row.type}</td><td>{row.customer}</td><td><b>{row.subject}</b><small className="job-id">{row.openedAt}</small></td><td><span className={`status ${statusTone(row.priority)}`}><i/> {row.priority}</span></td><td><span className={`status ${statusTone(row.status)}`}><i/> {row.status}</span></td><td>{row.assignedTo}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="empty-state">Veritabanında eşleşen kayıt bulunamadı.</td></tr>}</tbody></table></div></section>
    <div className="module-tip"><Headphones size={18}/><div><b>Canlı müşteri geri bildirimi</b><span>Liste complaint_requests tablosundaki müşteri, öncelik, durum ve atama bilgilerini gösterir.</span></div></div>
  </>
}

function ModuleView({ name, search, onAdd }: { name: string; search: string; onAdd: () => void }) {
  const detail = moduleDetails[name]
  const rows = detail.rows.filter(row => row.some(cell => cell.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))))
  return <>
    <div className="module-heading"><div><div className="eyebrow"><span className="live-dot" /> MODÜL YÖNETİMİ</div><h1>{name}</h1><p>{detail.description}</p></div><button className="primary" onClick={onAdd}><Plus size={18}/> Yeni kayıt</button></div>
    <section className="module-stats">{detail.stats.map(([title, value]) => <div className="module-stat" key={title}><span>{title}</span><strong>{value}</strong><small><ArrowUpRight size={13}/> Güncel veri</small></div>)}</section>
    <section className="panel module-table"><div className="module-toolbar"><div><h2>{name} kayıtları</h2><p>{rows.length} kayıt gösteriliyor</p></div><div className="toolbar-actions"><button><SlidersHorizontal size={15}/> Filtrele</button><button className="primary" onClick={onAdd}><Plus size={15}/> Yeni kayıt</button></div></div><div className="table-wrap"><table><thead><tr>{detail.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cell}>{cellIndex === 0 ? <b className="order-id">{cell}</b> : cellIndex === row.length - 1 ? <span className="status green"><i/> {cell}</span> : cell}</td>)}</tr>)}{rows.length === 0 && <tr><td colSpan={detail.columns.length} className="empty-state">Aramanızla eşleşen kayıt bulunamadı.</td></tr>}</tbody></table></div></section>
    <div className="module-tip"><ShieldCheck size={18}/><div><b>İşlemleriniz kayıt altında</b><span>Bu modüldeki değişiklikler kullanıcı hareketleri geçmişine otomatik olarak eklenir.</span></div></div>
  </>
}

function App() {
  const [active, setActive] = useState('Genel Bakış')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(false)
  const [period, setPeriod] = useState('Son 30 gün')
  const [dashboardOrders, setDashboardOrders] = useState<DbOrder[]>([])
  useEffect(() => { fetch('/api/orders').then(response => response.ok ? response.json() : Promise.reject()).then(setDashboardOrders).catch(() => undefined) }, [])
  const recentOrders = dashboardOrders.length > 0 ? dashboardOrders.map(order => ({ id: order.idCode, customer: order.customer, product: order.product, date: order.date, total: money(order.total), status: order.status, tone: statusTone(order.status) })) : orders

  return <div className="app-shell">
    <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark"><Cog size={23} /></div><div><strong>tarım<span>pro</span></strong><small>YÖNETİM PANELİ</small></div><button className="close-menu" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="branch-select"><div className="branch-icon"><Building2 size={17}/></div><div><small>AKTİF ŞUBE</small><b>Merkez Şube</b></div><ChevronDown size={16} /></div>
      <nav>{menu.map(({ label, icon: ItemIcon, badge }) => <button key={label} onClick={() => { setActive(label); setSidebarOpen(false) }} className={active === label ? 'nav-item active' : 'nav-item'}><ItemIcon size={18}/><span>{label}</span>{badge && <em>{badge}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Headphones size={18}/></div><div><b>Yardıma mı ihtiyacınız var?</b><span>Destek ekibimize ulaşın</span></div><ChevronRight size={16}/></div><div className="profile"><div className="avatar">SA</div><div><b>Selim Aksoy</b><span>Yönetici</span></div><MoreHorizontal size={18}/></div></div>
    </aside>
    {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
    <main className="main">
      <header><button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button><div className="breadcrumb"><span>Yönetim</span><ChevronRight size={14}/><b>{active}</b></div><div className="header-actions"><label className="search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..." /></label><button className={notice ? 'icon-btn has-notice' : 'icon-btn'} onClick={() => setNotice(!notice)}><Bell size={19}/></button><div className="header-user"><div className="avatar">SA</div><ChevronDown size={15}/></div></div></header>
      {notice && <div className="notification"><b>Bildirimler</b><span>12 üründe kritik stok seviyesi</span><span>3 yeni servis talebi</span></div>}
      <div className="content">{active === 'Genel Bakış' ? <><div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> Sistemler normal</div><h1>Günaydın, Selim Bey <span>✦</span></h1><p>İşletmenizin bugünkü durumuna genel bakış.</p></div><button className="primary" onClick={() => setNotice(true)}><Plus size={18}/> Yeni İşlem <ChevronDown size={15}/></button></div>
        <section className="stat-grid">{stats.map(s => { const SIcon = s.icon; return <div className="stat-card" key={s.title}><div className={'stat-icon ' + s.color}><SIcon size={19}/></div><div className="stat-title">{s.title}<MoreHorizontal size={17}/></div><strong>{s.value}</strong><div className="stat-change"><span className={s.change.startsWith('-') ? 'negative' : ''}>{s.change.startsWith('-') ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>} {s.change}</span><small>{s.note}</small></div></div> })}</section>
        <div className="dashboard-grid"><section className="panel sales-panel"><div className="panel-head"><div><h2>Satış performansı</h2><p>Toplam satış geliri</p></div><select value={period} onChange={e => setPeriod(e.target.value)}><option>Son 30 gün</option><option>Son 7 gün</option><option>Bu yıl</option></select></div><div className="sales-number">₺ 428.650 <span>+12,8%</span></div><div className="chart"><div className="chart-labels"><span>₺ 40K</span><span>₺ 30K</span><span>₺ 20K</span><span>₺ 10K</span><span>₺ 0</span></div><svg viewBox="0 0 760 200" preserveAspectRatio="none" aria-label="Satış grafiği"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d64545" stopOpacity=".28"/><stop offset="100%" stopColor="#d64545" stopOpacity="0"/></linearGradient></defs><path className="area" d="M0 157 C55 146 70 169 125 140 S191 120 235 137 S301 90 350 110 S412 88 450 100 S507 59 552 83 S606 70 645 92 S701 34 760 48 L760 200 L0 200Z"/><path className="line" d="M0 157 C55 146 70 169 125 140 S191 120 235 137 S301 90 350 110 S412 88 450 100 S507 59 552 83 S606 70 645 92 S701 34 760 48"/><circle cx="701" cy="34" r="5" className="point"/></svg><div className="x-labels"><span>01 Haz</span><span>05 Haz</span><span>10 Haz</span><span>15 Haz</span><span>20 Haz</span><span>25 Haz</span><span>30 Haz</span></div></div></section>
          <section className="panel quick-panel"><div className="panel-head"><div><h2>Hızlı işlemler</h2><p>Sık kullandığınız işlemler</p></div></div><div className="quick-grid">{[[Package,'Ürün ekle','Yeni ürün tanımla'],[ShoppingCart,'Sipariş oluştur','Yeni satış kaydı'],[Wrench,'Servis kaydı','Tamir / bakım ekle'],[ClipboardCheck,'Teklif oluştur','Müşteriye teklif hazırla']].map(([I, title, sub]) => { const Q = I as Icon; return <button key={title as string} onClick={() => setNotice(true)}><div className="quick-icon"><Q size={19}/></div><div><b>{title as string}</b><span>{sub as string}</span></div><ChevronRight size={16}/></button> })}</div><div className="task-summary"><div className="ring">72%</div><div><b>Günlük görevler</b><span>18 / 25 görev tamamlandı</span></div><ChevronRight size={16}/></div></section>
        </div>
        <div className="lower-grid"><section className="panel table-panel"><div className="panel-head"><div><h2>Son siparişler</h2><p>Son gerçekleşen satış işlemleri</p></div><button className="text-btn" onClick={() => setActive('Siparişler')}>Tümünü gör <ChevronRight size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>SİPARİŞ NO</th><th>MÜŞTERİ</th><th>ÜRÜN</th><th>TARİH</th><th>TUTAR</th><th>DURUM</th></tr></thead><tbody>{orders.filter(o => Object.values(o).some(v => v.toLowerCase().includes(search.toLowerCase()))).map(o => <tr key={o.id}><td><b className="order-id">{o.id}</b></td><td>{o.customer}</td><td>{o.product}</td><td className="muted">{o.date}</td><td><b>{o.total}</b></td><td><span className={'status ' + o.tone}><i/> {o.status}</span></td></tr>)}</tbody></table></div></section><section className="panel stock-panel"><div className="panel-head"><div><h2>Stok durumu</h2><p>Depolardaki kritik ürünler</p></div><button className="filter-btn"><SlidersHorizontal size={15}/></button></div><div className="warehouse"><div className="warehouse-icon"><Building2 size={18}/></div><div><b>Merkez Depo</b><span>284 farklı ürün</span></div><strong>78%</strong></div><div className="progress"><span style={{width:'78%'}}/></div><div className="stock-alert"><AlertCircle size={18}/><div><b>12 ürün kritik seviyede</b><span>Yeniden sipariş vermeyi unutmayın.</span></div><ChevronRight size={16}/></div><div className="last-sync"><Clock3 size={14}/> Son güncelleme: 2 dk önce</div></section></div>
        <div className="bottom-strip"><div><Activity size={17}/><b>Operasyon özeti</b><span>Bugün 14 saha işi planlandı</span></div><div><MapPin size={17}/><b>Saha ekibi</b><span>8 ekip aktif görevde</span></div><div><CheckCircle2 size={17}/><b>Memnuniyet</b><span>4,8 / 5,0 müşteri puanı</span></div></div></> : active === 'Siparişler' ? <OrdersView search={search} /> : active === 'Şikayet-Talep' ? <ComplaintsView search={search} /> : active === 'Saha İşleri' ? <FieldJobsView search={search} /> : active === 'Analiz & Raporlama' ? <ReportsView /> : active === 'Yapay Zeka Ajanları' ? <AIAgentsView /> : <ModuleView name={active} search={search} onAdd={() => setNotice(true)} />}</div>
    </main>
  </div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
