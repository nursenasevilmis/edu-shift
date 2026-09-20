import { Link } from 'react-router-dom'

const copy = {
  terms: {
    title: 'Kullanım şartları',
    intro: 'EduShift, okul personelinin haftalık ders programı hazırlamasına yardımcı olan yetkili bir iç operasyon aracıdır.',
    sections: [['Yetkili kullanım', 'Bu alan yalnızca okul tarafından yetkilendirilmiş müdür, editör ve öğretmen hesapları için kullanılabilir. Hesap bilgileri kişisel tutulmalı ve başka biriyle paylaşılmamalıdır.'], ['Program kayıtları', 'Program, ders, öğretmen ve şube kayıtlarının doğruluğundan okulun yetkili yöneticileri sorumludur. Otomatik oluşturma sonucu yayınlanmadan önce kontrol edilmelidir.'], ['Değişiklikler', 'Okulun operasyon kuralları değiştiğinde yöneticiler zaman ayarlarını ve öğretmen kısıtlarını güncellemelidir.']],
  },
  privacy: {
    title: 'Gizlilik',
    intro: 'EduShift, okul programını çalıştırmak için gerekli olan hesap, öğretmen, ders ve şube bilgilerini işler.',
    sections: [['Veri erişimi', 'Kullanıcılar yalnızca rollerinin izin verdiği kayıtları görür. Öğretmenler kendi programlarıyla sınırlı erişime sahiptir.'], ['Veri güvenliği', 'Oturum yönetimi Supabase Auth üzerinden yapılır. Veritabanı erişim politikaları Row Level Security kurallarıyla sınırlandırılır.'], ['İletişim', 'Veri veya erişim talebi için okulunuzun EduShift yöneticisine başvurun.']],
  },
}

export default function LegalPage({ type }) {
  const page = copy[type]
  return <main className="min-h-screen bg-[#e9e6de] text-[#202822] p-6 md:p-12"><div className="max-w-[760px] mx-auto"><Link to="/login" className="font-semibold text-[#1f5c4b] underline underline-offset-2">EduShift’e dön</Link><header className="border-b-2 border-[#202822] pb-6 mt-14"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#68726b] mb-3">EduShift / okul operasyon merkezi</p><h1 className="text-4xl md:text-5xl font-semibold">{page.title}</h1><p className="text-[#68726b] leading-relaxed mt-5 max-w-xl">{page.intro}</p></header><div className="divide-y divide-[#cbcfc8]">{page.sections.map(([title, text], index) => <section key={title} className="py-7 grid md:grid-cols-[150px_1fr] gap-5"><p className="font-mono text-xs text-[#68726b]">0{index + 1} / {title}</p><p className="text-sm leading-7 max-w-xl">{text}</p></section>)}</div><footer className="pt-6 border-t border-[#cbcfc8] text-xs text-[#68726b]">Son güncelleme: 20 Eylül 2026</footer></div></main>
}
