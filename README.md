# Innerlist — Bekleme Listesi Sitesi

> A thousand moments. When you are the Innerlist.

Innerlist'in lansman öncesi bekleme listesi sitesi. Ziyaretçiler perdeyi aralayıp siteye girer, **üye** ya da **organizatör** olarak devam eder ve kendilerine özel bir kartla listeye katılır.

Site tek bir `index.html` dosyasından oluşur. Düz HTML, CSS ve JavaScript ile yazıldı; derleme adımı, paket kurulumu ya da framework gerektirmez. Görseller dosyanın içine gömülüdür, bu yüzden dosya tek başına çalışır.

**İletişim:** contact@innerlist.house

---

## İçindekiler

- [Akış](#akış)
- [Dosya yapısı](#dosya-yapısı)
- [Yerelde çalıştırma](#yerelde-çalıştırma)
- [Vercel'de yayınlama](#vercelde-yayınlama)
- [Doğrudan bağlantılar](#doğrudan-bağlantılar)
- [İçerik ve dil](#i̇çerik-ve-dil)
- [Renkler ve yazı tipleri](#renkler-ve-yazı-tipleri)
- [Görseller](#görseller)
- [Formları bağlama](#formları-bağlama)
- [Yayından önce kontrol listesi](#yayından-önce-kontrol-listesi)
- [Erişilebilirlik ve performans](#erişilebilirlik-ve-performans)

---

## Akış

**Giriş**
1. Site kapalı bir kadife perdeyle açılır. Ziyaretçi mühre basılı tutar, halka dolunca perde aralanır.
2. Açılış cümleleri ortada sırayla belirir ve söner. Tekrar gelenler için "Skip" bağlantısı vardır.
3. İki kemerli kapı gelir: **Üye olarak** ve **Organizatör olarak**. İmleç (ya da parmak) hangi kapının üzerindeyse o kapı aydınlanır.

**Üye akışı**
1. Üç üyelik kartı sırayla belirir: Inner, Innerly, Innerlist.
2. Form: ad, e-posta, meslek, Instagram, ilgilenilen üyelik ve KVKK onayı.
3. Onay ekranı: kart önce arka yüzüyle gelir. Üstteki yarım daire çark çevrilince kart döner, sıra numarası sayarak yerine iner ve davet bağlantısı kopyalanabilir hale gelir.

**Organizatör akışı**
1. Açılış cümleleri, ardından dört kitle kartı: topluluklar, etkinlik planlamacıları, markalar, gece kulüpleri.
2. Nasıl çalışır: dört adım (başvur, yayınla, seç, ağırla) ve komisyon notu.
3. Üç adımlı başvuru: organizatör türü, iletişim bilgileri, etkinlik bilgileri (etkinlik türünde çoklu seçim yapılabilir).
4. Onay ekranı: "İnceleniyor" etiketli organizatör talep kartı ve sonraki adımlar.

Site ekran genişliğine göre kendini ayarlar; 820px altında mobil düzen açılır.

---

## Dosya yapısı

```
.
├── index.html   # Sitenin tamamı: HTML, CSS, JavaScript ve gömülü görseller
└── README.md
```

`index.html` içinde bölümler şu sırayla durur:

| Bölüm | Ne var |
|---|---|
| `<style>` | Tasarım değişkenleri (`:root`), bileşen stilleri, mobil kurallar |
| `<section id="gate">` | Açılış yazıları ve kapı seçimi |
| `#tiers`, `#form`, `#done` | Üye akışı |
| `#hintro`, `#hhow`, `#hform`, `#hdone` | Organizatör akışı |
| `#curtain` | Perde ve mühür |
| `<script>` | `IL_COPY` ve `IL_HOST` metin sözlükleri, ardından tüm etkileşim kodu |

---

## Yerelde çalıştırma

Dosyayı çift tıklayıp tarayıcıda açmak yeterlidir. Kopyalama butonu gibi bazı tarayıcı özellikleri `file://` adresinde kısıtlı çalışabileceği için gerçekçi bir test için küçük bir sunucu önerilir:

```bash
npx serve .
# ya da
python3 -m http.server 8000
```

---

## Vercel'de yayınlama

1. `index.html` dosyasını GitHub reposunun köküne koyun.
2. Vercel'de **Add New → Project** ile repoyu içe aktarın.
3. **Framework Preset** olarak **Other** seçin, build komutu ve output dizini boş kalabilir.
4. **Deploy**.

Bundan sonra `main` dalına gönderilen her değişiklik otomatik olarak yayına alınır. Alan adını Vercel'de **Settings → Domains** altından bağlayabilirsiniz.

---

## Doğrudan bağlantılar

Perdeyi atlayıp doğrudan bir akışı açan bağlantılar:

| Bağlantı | Açılan ekran |
|---|---|
| `/#member` | Üyelik kartları |
| `/#organizer` | Organizatör akışı |

Organizatörlere ya da iş ortaklarına gönderilecek e-postalarda `/#organizer` kullanılabilir. Eski `/#host` bağlantısı da aynı yere gider.

---

## İçerik ve dil

Site İngilizce ve Türkçedir. İlk ziyarette tarayıcı dili Türkçe ise Türkçe, değilse İngilizce açılır; ziyaretçinin seçimi tarayıcıda hatırlanır.

Tüm metinler `<script>` içindeki iki sözlükte durur:

- **`IL_COPY`**: açılış, kapılar, üyelik kartları, üye formu ve üye onay kartı
- **`IL_HOST`**: organizatör akışının tamamı

Her sözlükte `en` ve `tr` anahtarları vardır. Bir metni değiştirirken iki dili birlikte güncelleyin. HTML'deki `data-t="anahtar"` (üye tarafı) ve `data-h="anahtar"` (organizatör tarafı) öznitelikleri metnin hangi anahtardan geleceğini belirler.

Slogan ("A thousand moments. When you are the Innerlist.") iki dilde de İngilizce kalır ve HTML içinde doğrudan yazılıdır.

---

## Renkler ve yazı tipleri

Renkler `<style>` başındaki `:root` içinde tanımlıdır ve Innerlist Tasarım Sistemi'ni izler:

| Değişken | Değer | Kullanım |
|---|---|---|
| `--canvas` | `#16302b` | Koyu yeşil zemin, Innerlist kartı |
| `--deep` | `#162127` | Form alanları, koyu yüzeyler |
| `--room` | `#0d1511` | Karanlık oda zemini |
| `--card` | `#e6d8bf` | Krem kart, seçili öğeler |
| `--brass` | `#a38560` | Pirinç çizgiler ve çerçeveler |
| `--accent` | `#c9ad84` | Bağlantılar, küçük etiketler |
| `--muted` | `#b5ccbf` | İkincil metin |

Üyelik renkleri: **Inner** gri `#3a3c3a`, **Innerly** kahverengi `#4a3321`, **Innerlist** koyu yeşil `#16302b`.

Yazı tipleri: başlıklarda **Lora**, metinde **Georgia** (Google Fonts'tan yüklenemezse **Gelasio**, o da olmazsa sistem serif yazı tipi).

---

## Görseller

Görseller `index.html` içine base64 olarak gömülüdür:

| Görsel | Kullanım |
|---|---|
| Mühür (emblem) | Perdedeki mühür, kartın arka yüzü, sekme simgesi |
| Bahçe | Üye kapısı |
| Çerçeveli oda | Organizatör kapısı |
| Beş bulanık arka plan | Her ekranın arkasındaki buğulu görsel |

Arka plan görselleri önceden bulanıklaştırılıp küçültüldüğü için her biri 2–3 KB'tır ve sayfayı yavaşlatmaz. Değiştirirken aynı yöntemi kullanın: görseli yaklaşık 480×300 piksele küçültün, Gaussian blur uygulayın, WebP olarak kaydedin.

Bir görseli değiştirmek için ilgili `src="data:image/webp;base64,..."` değerini yenisiyle değiştirin ya da görseli ayrı bir `assets/` klasörüne koyup `src="assets/dosya.webp"` şeklinde bağlayın.

> **Önemli:** Şu anki fotoğraflar sunum dosyasından alınmıştır. Yayından önce lisanslı ya da Innerlist'e ait görsellerle değiştirilmelidir.

---

## Formları bağlama

**Formlar şu an hiçbir yere veri göndermiyor.** Script içinde iki yer tutucu fonksiyon var:

```js
function submitWaitlist(data) { ... }  // üye formu
function submitHost(data) { ... }      // organizatör formu
```

İkisi de bir `Promise` döndürmelidir. Örnek olarak bir Vercel API route'una bağlamak için:

```js
function submitWaitlist(data) {
  return fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(function (r) {
    if (!r.ok) throw new Error("Request failed");
    return r.json();
  });
}
```

Gönderilen veriler:

**Üye (`submitWaitlist`)**
```json
{
  "name": "…", "email": "…", "occupation": "…", "instagram": "…",
  "interest": "inner | innerly | innerlist",
  "consent": true, "lang": "en | tr"
}
```

**Organizatör (`submitHost`)**
```json
{
  "type": "community | planner | brand | club",
  "organization": "…", "name": "…", "email": "…", "link": "…",
  "kinds": ["dinner", "launch"], "size": "s | m | l | xl",
  "when": "month | quarter | later", "about": "…", "lang": "en | tr"
}
```

Veriler ileride admin panelindeki **Innerlist Applications** ve **Organizers** ekranlarına akacağı için baştan bir veritabanına (ör. Supabase) yazılması önerilir. Her üye kaydında bir durum alanı tutmak (`waitlist`, `beta_invited`, `beta_active`) beta seçimini kolaylaştırır.

**Şu an tarayıcıda üretilen örnek değerler:** sıra numarası, davet kodu ve organizatör talep numarası e-posta adresinden hesaplanan sahte değerlerdir. Gerçek değerleri sunucudan döndürüp `ticketValues()` ve `fillHostCard()` fonksiyonlarında kullanın. Hata durumunda kullanıcıya bir mesaj göstermek için `submit…().then(...)` çağrılarına bir `.catch(...)` ekleyin.

---

## Yayından önce kontrol listesi

- [ ] `submitWaitlist()` ve `submitHost()` bir backend'e bağlandı
- [ ] Sıra numarası, davet kodu ve talep numarası sunucudan geliyor
- [ ] Davet bağlantısındaki yer tutucu alan adı (`innerlist.app/r/...`) gerçek alan adıyla değiştirildi
- [ ] "[2 working days]" / "[2 iş günü]" yer tutucusu güncellendi
- [ ] Alt bilgideki "Privacy notice / Aydınlatma metni" bağlantısı KVKK metnine bağlandı
- [ ] Fotoğraflar lisanslı ya da Innerlist'e ait görsellerle değiştirildi
- [ ] Sosyal medya paylaşım görseli ve açıklaması (Open Graph etiketleri) eklendi
- [ ] Safari (iPhone) ve Chrome (Android) üzerinde gerçek cihazda test edildi

---

## Erişilebilirlik ve performans

- Mühre basılı tutmak yerine klavyede **Enter** ya da **Boşluk** ile de girilir; çark **sağ ok** / **Enter** ile çevrilir.
- İşletim sisteminde "hareketi azalt" ayarı açık olan ziyaretçilere animasyonlar atlanarak gösterilir.
- Durumlar yalnızca renkle değil metinle de belirtilir; odak halkası her zaman görünür.
- Dosyanın tamamı yaklaşık 520 KB'tır ve dışarıdan yalnızca Google Fonts yüklenir.

---

© 2026 Innerlist · contact@innerlist.house
