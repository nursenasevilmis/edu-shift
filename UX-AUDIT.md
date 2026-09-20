# EduShift UX inceleme notları

## İnceleme çerçevesi

Uygulama, **okul müdürünün haftalık programı yayınlamadan önce güvenle kontrol edebilmesi** hedefiyle değerlendirildi. Değerlendirme; bilgi mimarisi, kritik görevlerin görünürlüğü, hata önleme, mobil kullanım ve görsel güven sinyalleri üzerinden yapıldı.

## Müdür gözüyle güçlü taraflar

Uygulamanın temel iş modeli doğru: şube, ders, öğretmen, kısıt ve program ayrı sorumluluk alanlarına ayrılmış. Öğretmen ve şube çakışmalarının hem kullanıcı arayüzünde hem veritabanında korunması, okul operasyonu açısından en kritik güven katmanı. Otomatik program oluşturma özelliği de özellikle dönem başında ciddi zaman kazandırabilecek bir kapasite.

Program oluşturucudaki sürükle-bırak yaklaşımı, müdür veya koordinatörün program üzerinde hızlı düzeltme yapmasına uygun. Blok ders desteği ve öğretmen kısıtları da gerçek okul senaryolarını karşılıyor.

## İlk sürümde mantıksız veya riskli görünen noktalar

| Öncelik | Bulgu | Müdür açısından etkisi | Önerilen yön |
|---|---|---|---|
| P0 | Programın yayınlanma durumu ayrı bir kavram olarak görünmüyor. | Müdür, ekranda programın sadece dolu mu yoksa gerçekten paylaşılabilir mi olduğunu anlayamıyor. | `Taslak → Kontrolde → Yayında` durum modeli ve yayınlama onayı eklenmeli. |
| P0 | Dashboard daha önce sayısal özet ağırlıklıydı. | Sayı görmek, hangi kararın şimdi verilmesi gerektiğini söylemiyor. | İlk bakışta eksik blok, öğretmensiz ders ve aşırı yük doğrudan aksiyon bağlantısıyla gösterilmeli. |
| P1 | Şube bazlı program oluşturma var ancak haftalık okul görünümü yok. | Bir öğretmenin farklı şubelerde aynı saatte çakışıp çakışmadığı müdür açısından zor izlenebilir. | “Öğretmen görünümü” ve okul geneli çakışma/boşluk özeti eklenmeli. |
| P1 | Silme işlemleri geri alınabilir bir geçmiş sunmuyor. | Yanlışlıkla temizlenen bir programı geri getirmek zorlaşabilir. | Son işlemler/audit log ve en azından “geri al” penceresi eklenmeli. |
| P1 | Program ekranında dolu hücreye tıklamak silme davranışına bağlı. | Kullanıcı yanlışlıkla ders silebilir; tıklama ve silme aynı etkileşim olmamalı. | Hücre menüsü veya sağ tık/klavye aksiyonu ile “Detay / Taşı / Kaldır” ayrıştırılmalı. |
| P2 | Bazı sayfalarda aksiyonlar hâlâ doğrudan veri tablosu gibi algılanıyor. | Yeni editör için sistemin doğru kullanım sırası net değil. | İlk kurulum rehberi, boş durumlarda sonraki adım ve bağlamsal yardım eklenmeli. |
| P2 | PDF alma, paylaşma ve yayınlama akışı ürünün merkezinde değil. | Müdürün gerçek işi programı hazırlamak kadar öğretmenlere ulaştırmak. | Yayın önizlemesi, PDF/print paylaşımı ve yayın geçmişi görünür hale getirilmeli. |

## Bu turda uygulanan tasarım değişiklikleri

- Vite başlangıç görünümünden ayrışan **EduShift / School Ops** görsel kimliği oluşturuldu.
- Koyu lacivert, operasyonel sidebar; bölüm grupları, aktif sayfa göstergesi ve mobil menü eklendi.
- Dashboard, “Programın yayınlama durumu” merkezli hale getirildi. Hazırlık skoru, eksik bloklar, öğretmensiz dersler ve yüksek öğretmen yükü aksiyona bağlandı.
- Yeni tasarım dili; sıcak açık arka plan, teal vurgu, daha belirgin tipografi, yumuşak ama kontrollü gölgeler ve küçük durum etiketleriyle ortaklaştırıldı.
- Giriş ekranı, kurumsal güven ve ürün değerini daha iyi anlatacak iki kolonlu bir karşılama ekranına dönüştürüldü.
- Program oluşturucuda başlık hiyerarşisi, şube seçimi, otomatik oluşturma ve şube temizleme aksiyonları daha anlaşılır hale getirildi.
- Geçici test Supabase değişkenleri kaldırıldı; üretim kimlik bilgileri repoya eklenmedi.

## Test sonucu

- `npm run build`: **Başarılı**.
- Tarayıcı testi: Giriş ekranı gerçek DOM olarak render edildi; mobil/masaüstü yönlendirme yapısı çalışır durumda; “Şifremi unuttum” görünümü açıldı.
- Vite sandbox erişimi için `vite.config.js` içine yalnızca `.manus.computer` host izni eklendi.
- `npm run lint`: **Mevcut teknik borç nedeniyle başarısız**. Değişiklik öncesinde de görülen React hook kuralları ve kullanılmayan değişkenler dahil toplam 15 hata ve 1 uyarı bulunuyor. Özellikle `Dashboard`, `ScheduleGrid`, `TeacherPanel` ve `TimeSettings` içindeki fonksiyonların `useEffect` öncesinde tanımlanması gerekiyor.

## Bir sonraki en mantıklı geliştirme sırası

1. Yayınlama durumu, yayın önizlemesi ve yayın geçmişi.
2. Program ekranında yanlışlıkla silmeyi önleyen hücre aksiyon menüsü.
3. Öğretmen görünümü ve okul genelinde çakışma özeti.
4. Lint borcunun temizlenmesi; veri çağrılarının `useCallback` veya uygun hook kalıbına taşınması.
5. E2E testleri: admin giriş, ders atama, öğretmen kısıtı, çakışma reddi, otomatik oluşturma ve PDF akışları.
