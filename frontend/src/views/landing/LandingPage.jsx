import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserSession } from 'src/utils/authSession';
import { useBranding } from 'src/contexts/BrandingContext';

const MOBILE_CSS = (primary) => `
  *{box-sizing:border-box}
  :root{--lp-primary:${primary}}
  @keyframes floatAnim{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @keyframes floatRev{0%,100%{transform:translateY(0)}50%{transform:translateY(14px)}}
  .lp-nav-links{display:flex;gap:24px;align-items:center;list-style:none;margin:0;padding:0}
  .lp-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:6px}
  .lp-hamburger span{display:block;width:24px;height:2.5px;background:#333;border-radius:3px;transition:all .25s}
  .lp-mobile-menu{display:none;position:fixed;top:64px;left:0;right:0;background:rgba(255,255,255,0.98);backdrop-filter:blur(16px);border-bottom:1px solid #eee;padding:20px 5vw 24px;z-index:999;flex-direction:column;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
  .lp-mobile-menu.open{display:flex}
  .lp-mobile-link{color:#333;text-decoration:none;font-weight:600;font-size:1rem;padding:12px 0;border-bottom:1px solid #f0f0f0;display:block}
  .lp-hero-inner{display:flex;align-items:center;gap:48px;max-width:1100px;margin:0 auto;width:100%;flex-wrap:wrap}
  .lp-hero-left{flex:1 1 360px;min-width:0}
  .lp-hero-right{flex:1 1 300px;display:flex;justify-content:center;align-items:center;min-width:0}
  .lp-hero-img{width:100%;max-width:440px;animation:floatAnim 4s ease-in-out infinite}
  .lp-float-badge{position:absolute;bottom:20px;left:-8px;background:#fff;border-radius:14px;padding:10px 16px;box-shadow:0 8px 28px rgba(0,0,0,.12);display:flex;align-items:center;gap:10px;animation:floatRev 3s ease-in-out infinite}
  .lp-stats{display:flex;gap:28px;margin-top:40px;flex-wrap:wrap}
  .lp-grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:40px}
  .lp-grid3-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:40px;max-width:900px;margin-left:auto;margin-right:auto}
  .lp-faq-grid{display:grid;gap:12px;margin-top:36px;max-width:700px;margin-left:auto;margin-right:auto}
  .lp-footer-links{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;list-style:none;padding:0;margin:0 0 20px}
  .lp-navlink{color:#444;text-decoration:none;font-weight:600;font-size:.92rem;transition:color .2s;padding:4px 0}
  .lp-navlink:hover{color:${primary}}
  @media(max-width:768px){
    .lp-nav-links{display:none}
    .lp-hamburger{display:flex}
    .lp-hero-inner{flex-direction:column;gap:32px;text-align:center}
    .lp-hero-left{order:1}
    .lp-hero-right{order:2;width:100%}
    .lp-hero-img{max-width:300px}
    .lp-float-badge{left:50%;transform:translateX(-50%);bottom:-16px;white-space:nowrap}
    .lp-stats{justify-content:center;gap:20px}
    .lp-grid3{grid-template-columns:1fr}
    .lp-grid3-steps{grid-template-columns:1fr}
    .lp-btns{justify-content:center}
  }
  @media(max-width:480px){
    .lp-hero-img{max-width:240px}
    .lp-float-badge{font-size:.8rem;padding:8px 12px}
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const session = getUserSession();
  const { branding } = useBranding();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (session) navigate(session.role === 'admin' ? '/dashboard/admin' : '/dashboard/user', { replace: true });
  }, [session, navigate]);

  const brand   = branding?.brand_name    || 'OTP Reseller';
  const tagline = branding?.brand_tagline || 'Platform Reseller OTP Terpercaya';
  const primary = branding?.primary_color || '#5d87ff';

  const features = [
    { emoji: '⚡', title: 'Instan & Otomatis',  desc: 'Nomor OTP aktif dalam hitungan detik, proses 24 jam tanpa konfirmasi manual.' },
    { emoji: '💰', title: 'Harga Terjangkau',   desc: 'Harga kompetitif dengan markup fleksibel. Semakin banyak beli, semakin hemat.' },
    { emoji: '🔒', title: 'Aman & Terpercaya',  desc: 'Transaksi terenkripsi, saldo terlindungi, dan history tercatat lengkap.' },
    { emoji: '📱', title: '100+ Layanan',        desc: 'WhatsApp, Telegram, Instagram, TikTok, dan puluhan layanan populer.' },
    { emoji: '💳', title: 'Topup QRIS',         desc: 'Isi saldo mudah via QRIS, langsung terverifikasi otomatis.' },
    { emoji: '🌐', title: 'Multi Platform',      desc: 'Akses dari mana saja — PC, HP, tablet — tampilan responsif.' },
  ];
  const steps = [
    { num: '01', title: 'Daftar Gratis',   desc: 'Buat akun dalam 30 detik, tidak perlu verifikasi rumit.' },
    { num: '02', title: 'Isi Saldo',       desc: 'Top up via QRIS, langsung masuk otomatis ke saldo akun.' },
    { num: '03', title: 'Beli Nomor OTP',  desc: 'Pilih layanan, beli nomor, terima kode OTP secara instan.' },
  ];
  const faqs = [
    { q: 'Apa itu OTP Reseller?',           a: 'Platform yang menyediakan nomor virtual sementara untuk menerima kode OTP dari berbagai layanan.' },
    { q: 'Berapa lama proses topup?',        a: 'Topup via QRIS diproses otomatis dalam hitungan detik setelah pembayaran berhasil.' },
    { q: 'Apakah nomor bisa dipakai berulang?', a: 'Tidak. Setiap nomor bersifat sekali pakai untuk keamanan dan keberhasilan verifikasi.' },
    { q: 'Bagaimana jika OTP tidak datang?', a: 'Jika waktu habis dan OTP tidak masuk, order otomatis dibatalkan dan saldo dikembalikan.' },
  ];

  // Inline styles (non-responsive, class handles breakpoints)
  const S = {
    root:    { fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#1a1a2e', overflowX:'hidden' },
    nav:     { position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'rgba(255,255,255,0.93)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,0,0,.06)', padding:'0 5vw', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 },
    navBrand:{ fontWeight:800, fontSize:'1.2rem', color:primary, textDecoration:'none' },
    hero:    { minHeight:'100vh', display:'flex', alignItems:'center', padding:'80px 5vw 64px', background:`linear-gradient(160deg,#f0f4ff 0%,#f8f0ff 50%,#fff0f5 100%)` },
    badge:   { display:'inline-block', background:`${primary}15`, color:primary, borderRadius:50, padding:'6px 18px', fontSize:'.8rem', fontWeight:700, marginBottom:18, border:`1px solid ${primary}30` },
    h1:      { fontSize:'clamp(1.9rem,4vw,3.1rem)', fontWeight:800, lineHeight:1.15, margin:'0 0 18px' },
    sub:     { fontSize:'clamp(.9rem,1.6vw,1.05rem)', color:'#666', maxWidth:460, margin:'0 0 32px', lineHeight:1.75 },
    btns:    { display:'flex', gap:14, flexWrap:'wrap' },
    btnP:    { background:primary, color:'#fff', border:'none', borderRadius:12, padding:'13px 32px', fontWeight:700, fontSize:'1rem', cursor:'pointer', textDecoration:'none', display:'inline-block', fontFamily:'inherit' },
    btnO:    { background:'transparent', color:primary, border:`2px solid ${primary}`, borderRadius:12, padding:'12px 24px', fontWeight:700, fontSize:'.95rem', cursor:'pointer', textDecoration:'none', display:'inline-block', fontFamily:'inherit' },
    statNum: { fontSize:'1.8rem', fontWeight:800, color:primary },
    statLbl: { fontSize:'.8rem', color:'#888', fontWeight:500 },
    section: { padding:'72px 5vw' },
    sectionAlt:{ padding:'72px 5vw', background:'#f8faff' },
    lbl:     { color:primary, fontWeight:700, fontSize:'.8rem', textTransform:'uppercase', letterSpacing:1, marginBottom:10 },
    h2:      { fontSize:'clamp(1.5rem,3vw,2.1rem)', fontWeight:800, marginBottom:12, lineHeight:1.2 },
    subTxt:  { color:'#777', fontSize:'1rem', lineHeight:1.7, marginBottom:0 },
    center:  { textAlign:'center', maxWidth:600, margin:'0 auto' },
    card:    { background:'#fff', borderRadius:20, padding:'24px 22px', border:'1px solid #eee' },
    stepCard:{ background:'#fff', borderRadius:20, padding:'22px', border:'1px solid #eee', display:'flex', gap:18, alignItems:'flex-start' },
    stepNum: { fontSize:'1.8rem', fontWeight:800, color:primary, opacity:.22, lineHeight:1, flexShrink:0 },
    faqCard: { background:'#fff', borderRadius:14, padding:'18px 20px', border:'1px solid #eee' },
    cta:     { background:`linear-gradient(135deg,${primary} 0%,${primary}bb 100%)`, padding:'72px 5vw', textAlign:'center', color:'#fff' },
    ctaH2:   { fontSize:'clamp(1.6rem,3vw,2.3rem)', fontWeight:800, margin:'0 0 14px', color:'#fff' },
    ctaSub:  { color:'rgba(255,255,255,.85)', fontSize:'1rem', margin:'0 auto 32px', maxWidth:460 },
    btnW:    { background:'#fff', color:primary, border:'none', borderRadius:12, padding:'14px 36px', fontWeight:800, fontSize:'1rem', cursor:'pointer', textDecoration:'none', display:'inline-block', fontFamily:'inherit' },
    footer:  { background:'#0f0f1a', color:'#aaa', padding:'44px 5vw 28px', textAlign:'center' },
    ftBrand: { fontWeight:800, fontSize:'1.2rem', color:'#fff', marginBottom:8 },
    ftSub:   { fontSize:'.88rem', marginBottom:20 },
    ftLink:  { color:'#aaa', textDecoration:'none', fontSize:'.88rem' },
    ftCopy:  { fontSize:'.78rem', color:'#444', marginTop:8 },
  };

  const NavLogo = () => branding?.logo_url
    ? <a href="/" style={{display:'flex',alignItems:'center',textDecoration:'none'}}><img src={branding.logo_url} alt={brand} style={{maxHeight:36,maxWidth:150,objectFit:'contain'}}/></a>
    : <a href="/" style={S.navBrand}>{brand}</a>;

  const FooterLogo = () => branding?.logo_url
    ? <img src={branding.logo_url} alt={brand} style={{maxHeight:40,maxWidth:150,objectFit:'contain',marginBottom:8,filter:'brightness(0) invert(1)'}}/>
    : <div style={S.ftBrand}>{brand}</div>;

  return (
    <div style={S.root}>
      <style>{MOBILE_CSS(primary)}</style>

      {/* NAV */}
      <nav style={S.nav} aria-label="Navigasi utama">
        <NavLogo />
        {/* Desktop links */}
        <ul className="lp-nav-links">
          <li><a href="#fitur"      className="lp-navlink">Fitur</a></li>
          <li><a href="#cara-kerja" className="lp-navlink">Cara Kerja</a></li>
          <li><a href="#faq"        className="lp-navlink">FAQ</a></li>
          <li><Link to="/auth/login"    style={S.btnO}>Masuk</Link></li>
          <li><Link to="/auth/register" style={{...S.btnP, padding:'10px 22px', fontSize:'.9rem'}}>Daftar Gratis</Link></li>
        </ul>
        {/* Hamburger */}
        <button className="lp-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
          <span style={menuOpen?{transform:'rotate(45deg) translate(5px,5px)'}:{}}/>
          <span style={menuOpen?{opacity:0}:{}}/>
          <span style={menuOpen?{transform:'rotate(-45deg) translate(5px,-5px)'}:{}}/>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`lp-mobile-menu${menuOpen?' open':''}`} role="navigation">
        <a href="#fitur"      className="lp-mobile-link" onClick={()=>setMenuOpen(false)}>🏆 Fitur</a>
        <a href="#cara-kerja" className="lp-mobile-link" onClick={()=>setMenuOpen(false)}>⚙️ Cara Kerja</a>
        <a href="#faq"        className="lp-mobile-link" onClick={()=>setMenuOpen(false)}>❓ FAQ</a>
        <Link to="/auth/login"    style={{...S.btnO, textAlign:'center', marginTop:4}} onClick={()=>setMenuOpen(false)}>Masuk</Link>
        <Link to="/auth/register" style={{...S.btnP, textAlign:'center'}} onClick={()=>setMenuOpen(false)}>Daftar Gratis 🚀</Link>
      </div>

      {/* HERO */}
      <style>{`@keyframes floatAnim{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}} @keyframes floatRev{0%,100%{transform:translateY(0)}50%{transform:translateY(14px)}}`}</style>
      <section style={S.hero} aria-labelledby="hero-heading">
        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <span style={S.badge}>🚀 Platform OTP Reseller #1 Indonesia</span>
            <h1 id="hero-heading" style={S.h1}>
              Beli Nomor OTP <span style={{color:primary}}>Instan &amp; Terpercaya</span>
            </h1>
            <p style={S.sub}>{tagline}. Verifikasi WhatsApp, Telegram, Instagram, dan 100+ layanan dalam hitungan detik. Otomatis 24 jam.</p>
            <div className="lp-btns" style={S.btns}>
              <Link to="/auth/register" style={S.btnP}>Mulai Gratis →</Link>
              <Link to="/auth/login"    style={S.btnO}>Sudah punya akun</Link>
            </div>
            <div className="lp-stats" style={S.stats}>
              {[['100+','Layanan'],['24/7','Online'],['QRIS','Topup'],['⚡','Instan']].map(([n,l])=>(
                <div key={l} style={{textAlign:'center'}}>
                  <div style={S.statNum}>{n}</div>
                  <div style={S.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-hero-right">
            <div style={{position:'relative',display:'inline-block'}}>
              <img src="/hero-otp.png" alt="OTP Reseller ilustrasi verifikasi nomor" className="lp-hero-img" loading="eager"/>
              <div className="lp-float-badge">
                <span style={{fontSize:'1.3rem'}}>⚡</span>
                <div>
                  <div style={{fontWeight:800,fontSize:'.82rem',color:'#1a1a2e'}}>OTP Diterima!</div>
                  <div style={{fontSize:'.7rem',color:'#888'}}>Dalam 3 detik</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" style={S.sectionAlt} aria-labelledby="fitur-h">
        <div style={S.center}>
          <p style={S.lbl}>Keunggulan</p>
          <h2 id="fitur-h" style={S.h2}>Mengapa Pilih {brand}?</h2>
          <p style={S.subTxt}>Semua yang kamu butuhkan untuk bisnis reseller OTP yang sukses</p>
        </div>
        <div className="lp-grid3">
          {features.map(f=>(
            <div key={f.title} style={S.card}>
              <div style={{fontSize:'2rem',marginBottom:12}}>{f.emoji}</div>
              <h3 style={{fontWeight:700,fontSize:'1rem',marginBottom:8}}>{f.title}</h3>
              <p style={{color:'#777',fontSize:'.88rem',lineHeight:1.65,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" style={S.section} aria-labelledby="steps-h">
        <div style={S.center}>
          <p style={S.lbl}>Cara Kerja</p>
          <h2 id="steps-h" style={S.h2}>3 Langkah Mudah</h2>
          <p style={S.subTxt}>Dari daftar hingga dapat penghasilan, hanya butuh beberapa menit</p>
        </div>
        <div className="lp-grid3-steps">
          {steps.map(st=>(
            <div key={st.num} style={S.stepCard}>
              <div style={S.stepNum}>{st.num}</div>
              <div>
                <h3 style={{fontWeight:700,fontSize:'1rem',marginBottom:6}}>{st.title}</h3>
                <p style={{color:'#777',fontSize:'.88rem',lineHeight:1.6,margin:0}}>{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={S.sectionAlt} aria-labelledby="faq-h">
        <div style={S.center}>
          <p style={S.lbl}>FAQ</p>
          <h2 id="faq-h" style={S.h2}>Pertanyaan yang Sering Ditanya</h2>
        </div>
        <div className="lp-faq-grid">
          {faqs.map(f=>(
            <div key={f.q} style={S.faqCard}>
              <h3 style={{fontWeight:700,marginBottom:8,fontSize:'.95rem'}}>{f.q}</h3>
              <p style={{color:'#777',fontSize:'.88rem',lineHeight:1.65,margin:0}}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={S.cta} aria-labelledby="cta-h">
        <h2 id="cta-h" style={S.ctaH2}>Siap Mulai Berjualan OTP?</h2>
        <p style={S.ctaSub}>Bergabung sekarang dan mulai hasilkan uang dari bisnis reseller OTP. Gratis, cepat, dan otomatis.</p>
        <Link to="/auth/register" style={S.btnW}>Daftar Gratis Sekarang 🚀</Link>
      </section>

      {/* FOOTER */}
      <footer style={S.footer} role="contentinfo">
        <FooterLogo />
        <p style={S.ftSub}>{tagline}</p>
        <ul className="lp-footer-links">
          {[['#fitur','Fitur'],['#cara-kerja','Cara Kerja'],['#faq','FAQ']].map(([h,l])=>(
            <li key={l}><a href={h} style={S.ftLink}>{l}</a></li>
          ))}
          <li><Link to="/auth/login"    style={S.ftLink}>Login</Link></li>
          <li><Link to="/auth/register" style={S.ftLink}>Daftar</Link></li>
        </ul>
        <p style={S.ftCopy}>© {new Date().getFullYear()} {brand}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
