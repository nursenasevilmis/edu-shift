import { Link } from 'react-router-dom'

const pages = {
  terms: {
    kicker: 'EduShift / kullanım çerçevesi',
    title: 'Kullanım şartları',
    intro: 'EduShift, okulun haftalık ders planını hazırlamak, kontrol etmek ve yetkili personelle paylaşmak için kullanılan bir okul operasyon aracıdır.',
    sections: [
      ['01', 'Yetkili kullanım', 'EduShift yalnızca okul tarafından yetkilendirilmiş admin, editör ve öğretmen hesaplarıyla kullanılabilir. Hesap bilgileri kişisel tutulmalı, ortak cihazlarda açık bırakılmamalı ve başka kişilerle paylaşılmamalıdır.'],
      ['02', 'Kayıtların sorumluluğu', 'Şube, ders, öğretmen, zaman ve uygunluk bilgilerinin doğru tutulmasından okulun yetkili yöneticileri sorumludur. Otomatik oluşturulan program yayınlanmadan önce mutlaka kontrol edilmelidir.'],
      ['03', 'Program değişiklikleri', 'Zaman ayarları, öğretmen izinleri ve atamalar değiştiğinde mevcut program yeniden gözden geçirilmelidir. Bir değişikliğin ders çakışmasına veya boş saate neden olup olmadığını kontrol etmek yöneticinin sorumluluğundadır.'],
      ['04', 'Erişim ve güvenlik', 'Kullanıcı rolü yalnızca görev için gereken düzeyde verilmelidir. Bir personelin görevi sona erdiğinde hesabı okul yöneticisi tarafından pasifleştirilmelidir.'],
    ],
  },
  privacy: {
    kicker: 'EduShift / veri kullanımı',
    title: 'Gizlilik bildirimi',
    intro: 'EduShift, okul programını çalıştırmak için gereken hesap, öğretmen, ders, şube ve zaman bilgilerini işler. Bu bilgiler okul operasyonu dışında kullanılmaz.',
    sections: [
      ['01', 'İşlenen bilgiler', 'Ad soyad, email adresi, kullanıcı rolü, öğretmen-şube bağlantısı, ders atamaları, zaman ayarları ve program kayıtları uygulamanın çalışması için saklanabilir.'],
      ['02', 'Erişim kapsamı', 'Admin hesapları okul operasyonu kayıtlarını yönetir. Editörler kendilerine verilen operasyon ekranlarını kullanır. Öğretmenler yalnızca kendileriyle ilişkili programı görür.'],
      ['03', 'Oturum güvenliği', 'Giriş işlemleri Supabase Auth üzerinden yürütülür. Veritabanı erişimi rol ve Row Level Security kurallarıyla sınırlandırılır. Kullanıcılar şifrelerini paylaşmamalıdır.'],
      ['04', 'Veri talepleri', 'Hesap, erişim veya veri düzeltme talepleri için okulunuzun EduShift admin hesabına başvurun. Uygulama içindeki kayıtların doğruluğu okul yönetiminin kontrolündedir.'],
    ],
  },
}

export default function LegalPage({ type }) {
  const page = pages[type] || pages.terms
  return <main className="legal-page"><div className="legal-shell"><Link to="/login" className="legal-back">← Giriş ekranına dön</Link><header className="legal-header"><p className="section-kicker">{page.kicker}</p><h1>{page.title}</h1><p>{page.intro}</p></header><div className="legal-sections">{page.sections.map(([number, title, text]) => <section key={number}><span>{number}</span><div><h2>{title}</h2><p>{text}</p></div></section>)}</div><footer><span>EduShift / School operations</span><span>Son güncelleme: 2 Ekim 2026</span></footer></div></main>
}
