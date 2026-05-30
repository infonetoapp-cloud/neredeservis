# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import datetime

OUTPUT_PATH = r"C:\Users\sinan\Desktop\w\nerede servis\proje_raporu.pdf"

# Colors
DARK = HexColor("#1a1a2e")
ACCENT = HexColor("#e94560")
ACCENT_LIGHT = HexColor("#fce4ec")
BG_LIGHT = HexColor("#f8f9fa")
BG_HEADER = HexColor("#16213e")
TEXT_DARK = HexColor("#2d2d2d")
TEXT_MED = HexColor("#555555")
TEXT_LIGHT = HexColor("#888888")
GREEN = HexColor("#2e7d32")
ORANGE = HexColor("#ef6c00")
RED = HexColor("#c62828")
YELLOW_BG = HexColor("#fff8e1")
RED_BG = HexColor("#ffebee")
GREEN_BG = HexColor("#e8f5e9")
BLUE_BG = HexColor("#e3f2fd")
BORDER = HexColor("#e0e0e0")

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=25*mm,
        bottomMargin=20*mm,
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        'ReportTitle', parent=styles['Title'],
        fontName='Helvetica-Bold', fontSize=28, textColor=white,
        alignment=TA_CENTER, spaceAfter=6*mm,
    ))
    styles.add(ParagraphStyle(
        'ReportSubTitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=13, textColor=HexColor("#b0bec5"),
        alignment=TA_CENTER, spaceAfter=3*mm,
    ))
    styles.add(ParagraphStyle(
        'ReportSectionHeader', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=16, textColor=DARK,
        spaceBefore=8*mm, spaceAfter=4*mm,
        borderWidth=0, borderColor=ACCENT, borderPadding=(0,0,2*mm,0),
    ))
    styles.add(ParagraphStyle(
        'ReportSubSection', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=13, textColor=ACCENT,
        spaceBefore=5*mm, spaceAfter=3*mm,
    ))
    styles.add(ParagraphStyle(
        'ReportBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, textColor=TEXT_DARK,
        alignment=TA_JUSTIFY, spaceAfter=3*mm, leading=14,
    ))
    styles.add(ParagraphStyle(
        'ReportBullet', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.5, textColor=TEXT_DARK,
        leftIndent=15*mm, spaceAfter=2*mm, leading=13,
    ))
    styles.add(ParagraphStyle(
        'ReportCode', parent=styles['Normal'],
        fontName='Courier', fontSize=8.5, textColor=HexColor("#333333"),
        leftIndent=10*mm, rightIndent=5*mm,
        spaceBefore=2*mm, spaceAfter=3*mm,
        backColor=HexColor("#f5f5f5"), borderWidth=1, borderColor=BORDER,
        borderPadding=4*mm,
    ))
    styles.add(ParagraphStyle(
        'ReportTableHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9, textColor=white,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'ReportTableCell', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, textColor=TEXT_DARK,
        alignment=TA_LEFT, leading=12,
    ))
    styles.add(ParagraphStyle(
        'ReportTableCellCenter', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, textColor=TEXT_DARK,
        alignment=TA_CENTER, leading=12,
    ))
    styles.add(ParagraphStyle(
        'ReportFooter', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7, textColor=TEXT_LIGHT,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'BadgeP0', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, textColor=white,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'BadgeP1', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, textColor=white,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'BadgeP2', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, textColor=white,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'BadgeP3', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, textColor=TEXT_MED,
        alignment=TA_CENTER,
    ))

    # === COVER PAGE ===
    story.append(Spacer(1, 55*mm))
    story.append(Paragraph("NEREDE SERVIS", styles['Title']))
    story.append(Paragraph("Proje Denetim Raporu", styles['SubTitle']))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(
        f"Tarih: {datetime.date.today().strftime('%d %B %Y')}",
        ParagraphStyle('coverDate', parent=styles['Normal'],
                       fontName='Helvetica', fontSize=11, textColor=TEXT_MED,
                       alignment=TA_CENTER, spaceAfter=2*mm)
    ))
    story.append(Paragraph(
        "Kapsam: Flutter Mobil Uygulama + Node.js Backend API + Firebase + Website",
        ParagraphStyle('coverScope', parent=styles['Normal'],
                       fontName='Helvetica', fontSize=10, textColor=TEXT_LIGHT,
                       alignment=TA_CENTER)
    ))
    story.append(Spacer(1, 30*mm))

    # Summary boxes on cover
    summary_data = [
        [Paragraph("433", ParagraphStyle('cv', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, textColor=ACCENT, alignment=TA_CENTER)),
         Paragraph("69.9%", ParagraphStyle('cv', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, textColor=ORANGE, alignment=TA_CENTER)),
         Paragraph("184", ParagraphStyle('cv', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, textColor=GREEN, alignment=TA_CENTER)),
         Paragraph("10+", ParagraphStyle('cv', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, textColor=RED, alignment=TA_CENTER))],
        [Paragraph("Dart Dosyasi", ParagraphStyle('cv2', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=TEXT_MED, alignment=TA_CENTER)),
         Paragraph("Test Kapsam", ParagraphStyle('cv2', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=TEXT_MED, alignment=TA_CENTER)),
         Paragraph("Test Dosyasi", ParagraphStyle('cv2', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=TEXT_MED, alignment=TA_CENTER)),
         Paragraph("Guvenlik Sorunu", ParagraphStyle('cv2', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=TEXT_MED, alignment=TA_CENTER))],
    ]
    summary_table = Table(summary_data, colWidths=[42*mm, 42*mm, 42*mm, 42*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, BORDER),
    ]))
    story.append(summary_table)

    story.append(PageBreak())

    # === TABLE OF CONTENTS ===
    story.append(Paragraph("ICINDEKILER", styles['SectionHeader']))
    toc_items = [
        "1. Proje Ozeti ve Mimari",
        "2. Kritik Guvenlik Sorunlari (P0)",
        "3. Yuksek Oncelikli Sorunlar (P1)",
        "4. Flutter Uygulama Sorunlari",
        "5. Backend API Sorunlari",
        "6. Guvenlik Aciklari Detaylari",
        "7. Test Durumu ve Kapsam",
        "8. Yapilandirma ve CI/CD Sorunlari",
        "9. Bagimlilik ve Versiyon Sorunlari",
        "10. Oncelikli Duzeltme Plan",
    ]
    for item in toc_items:
        story.append(Paragraph(item, ParagraphStyle('toc', parent=styles['BodyText2'], fontSize=10.5, spaceAfter=2*mm, leftIndent=5*mm)))

    story.append(PageBreak())

    # === HELPER FUNCTIONS ===
    def severity_badge(level):
        colors = {"P0": RED, "P1": ORANGE, "P2": HexColor("#0288d1"), "P3": TEXT_LIGHT}
        bg_colors = {"P0": RED_BG, "P1": YELLOW_BG, "P2": BLUE_BG, "P3": BG_LIGHT}
        c = colors.get(level, TEXT_LIGHT)
        bg = bg_colors.get(level, BG_LIGHT)
        return Paragraph(level, ParagraphStyle('badge', parent=styles['Normal'],
                                                fontName='Helvetica-Bold', fontSize=8,
                                                textColor=white if level in ("P0","P1","P2") else TEXT_MED,
                                                alignment=TA_CENTER, backColor=bg))

    def section_header(text):
        story.append(Paragraph(text, styles['SectionHeader']))

    def subsection(text):
        story.append(Paragraph(text, styles['SubSection']))

    def body(text):
        story.append(Paragraph(text, styles['BodyText2']))

    def bullet(text):
        story.append(Paragraph(f"  {text}", styles['BulletText']))

    def code(text):
        story.append(Paragraph(text, styles['CodeBlock']))

    def info_box(text, bg_color=BLUE_BG):
        data = [[Paragraph(text, ParagraphStyle('ib', parent=styles['Normal'],
                                                  fontName='Helvetica', fontSize=9,
                                                  textColor=TEXT_DARK, leading=13))]]
        t = Table(data, colWidths=[150*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 1, BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t)
        story.append(Spacer(1, 3*mm))

    def make_table(headers, rows, col_widths=None):
        all_rows = [headers] + rows
        n_cols = len(headers)
        if col_widths is None:
            col_widths = [(150*mm) / n_cols] * n_cols
        t = Table(all_rows, colWidths=col_widths)
        style_cmds = [
            ('BACKGROUND', (0, 0), (-1, 0), BG_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_DARK),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BG_LIGHT]),
        ]
        t.setStyle(TableStyle(style_cmds))
        story.append(t)
        story.append(Spacer(1, 4*mm))

    # === 1. PROJE OZETI ===
    section_header("1. Proje Ozeti ve Mimari")

    body("NeredeServis, Turk okul/servis araci takip uygulamasi olup surucu ve yolcu rollerini destekler. "
         "Firebase (Firestore + Realtime Database) backend olarak kullanilir, Node.js HTTP API ve Firebase Cloud Functions "
         "server-side mantigi yonetir.")

    subsection("Teknoloji Yigini")
    make_table(
        ["Katman", "Teknoloji", "Versiyon"],
        [
            [Paragraph("Mobil (Flutter)", styles['TableCell']), Paragraph("Flutter 3.24.5, Dart 3.5.4", styles['TableCell']), Paragraph("3.24.5", styles['TableCellCenter'])],
            [Paragraph("State Management", styles['TableCell']), Paragraph("Riverpod", styles['TableCell']), Paragraph("2.6.1", styles['TableCellCenter'])],
            [Paragraph("Routing", styles['TableCell']), Paragraph("go_router", styles['TableCell']), Paragraph("15.1.2", styles['TableCellCenter'])],
            [Paragraph("Local DB", styles['TableCell']), Paragraph("Drift (SQLite)", styles['TableCell']), Paragraph("2.29.0", styles['TableCellCenter'])],
            [Paragraph("Harita", styles['TableCell']), Paragraph("flutter_map + Mapbox", styles['TableCell']), Paragraph("8.1.1", styles['TableCellCenter'])],
            [Paragraph("Backend API", styles['TableCell']), Paragraph("Node.js (native http)", styles['TableCell']), Paragraph(">=20", styles['TableCellCenter'])],
            [Paragraph("Backend DB", styles['TableCell']), Paragraph("Firebase Admin SDK + PostgreSQL", styles['TableCell']), Paragraph("12.7.0 / 8.20", styles['TableCellCenter'])],
            [Paragraph("Cloud Functions", styles['TableCell']), Paragraph("TypeScript, Firebase Functions v2", styles['TableCell']), Paragraph("5.1.1", styles['TableCellCenter'])],
            [Paragraph("Website", styles['TableCell']), Paragraph("Next.js", styles['TableCell']), Paragraph("16.1.6", styles['TableCellCenter'])],
        ],
        [50*mm, 70*mm, 30*mm]
    )

    subsection("Proje Yapisi")
    bullet(f"lib/ dizini: 433 Dart dosyasi (263 feature dosyasi, 28 ekran)")
    bullet(f"backend/api/src/: 37 JavaScript dosyasi (1 server + 36 lib modul)")
    bullet(f"functions/: Firebase Cloud Functions (TypeScript)")
    bullet(f"website/: Next.js web uygulamasi")
    bullet(f"test/: 184 test dosyasi, %69.9 kapsam")
    bullet(f"integration_test/: 1 smoke test")

    subsection("Mimari Desen")
    bullet("Feature-First + Clean Architecture: Her feature data/domain/application/presentation katmanlarina ayrilmis")
    bullet("Riverpod ile state management, go_router ile guard-based routing")
    bullet("Drift ile yerel SQLite veritabani")
    bullet("flutter_map ile Mapbox tile tabanli harita render (Google Places adres onerileri icin)")

    story.append(PageBreak())

    # === 2. KRITIK GUVENLIK SORUNLARI (P0) ===
    section_header("2. Kritik Guvenlik Sorunlari (P0)")

    subsection("2.1 Switch Fall-Through Bug - passenger_tracking_screen.dart")
    body("passenger_tracking_screen.dart dosyasindaki switch statement'inda break ifadeleri eksik. "
         "Settings secenegine tiklandiginda skipToday ve leaveRoute callback'leri de tetikleniyor.")
    code("case _TopBarAction.settings:\n  onSettingsTap?.call();\ncase _TopBarAction.skipToday:\n  onSkipTodayTap?.call();\ncase _TopBarAction.leaveRoute:\n  onLeaveRouteTap?.call();")
    info_box("ETKI: Kullanici ayarlar'a girdiginde rotadan cikis islemi de otomatik olarak gerceklesebilir.", RED_BG)

    subsection("2.2 Zayif Sifre Uretimi - company-driver-mutations.js")
    body("Surucu hesaplarinin sifreleri, surucu adinin ilk 6 harfi + 4 haneli rastgele sayi olarak uretiliyor. "
         "Math.random() kriptografik olarak guvenli degildir. Saldiran bir surucunun adini biliyorsa "
         "en fazla 10.000 deneme ile sifreyi bulabilir.")
    code("function generateSimplePassword(name) {\n  const base = normalizeName(name).slice(0, 6) || 'sofor';\n  const suffix = Math.floor(1000 + Math.random() * 9000);\n  return `${base}${suffix}`;\n}")
    info_box("COZUM: crypto.randomBytes() kullanilarak guclu sifre uretilmeli.", RED_BG)

    subsection("2.3 Acik Metin Sifre Saklama - company-driver-mutations.js")
    body("Uretilen gecici sifreler Firestore'da drivers collection'inda acik metin olarak saklaniyor. "
         "Veritabani sizintisi durumunda tum surucu sifreleri ele gecebilir.")
    info_box("COZUM: Sifreler Firestore'da saklanmamali, sadece e-posta ile bir kez gonderilmeli.", RED_BG)

    subsection("2.4 Hardcoded Firebase API Anahtarlari - app_environment.dart")
    body("Uc Firebase Web API key'i kaynak kodunda fallback olarak hardcoded durumda:")
    code("AppFlavor.dev => 'AIzaSyDX4wqXAL1-...'\nAppFlavor.stg => 'AIzaSyDGX_QJV5dCQ...'\nAppFlavor.prod => 'AIzaSyCzjmPyvmT8Z...'")
    body("Firebase Web API key'leri teknik olarak 'public' olsa da (Firebase security rules ile korunur), "
         "kaynak kodda saklanmasi en iyi uygulama degildir.")

    subsection("2.5 PostgreSQL SSL Dogrulama Devre Disi - map-db.js")
    body("SSL etkinlestirildiginde sertifika dogrulama devre disi birakilmis (rejectUnauthorized: false). "
         "Bu, man-in-the-middle saldirilarina karsi savunmasiz birakir.")
    code("ssl: sslEnabled ? { rejectUnauthorized: false } : false")

    story.append(PageBreak())

    # === 3. YUKSEK ONCELIKLI SORUNLAR (P1) ===
    section_header("3. Yuksek Oncelikli Sorunlar (P1)")

    subsection("3.1 Release Build Debug Imza Kullaniyor")
    body("android/app/build.gradle dosyasinda release build'ler icin debug signing config kullaniliyor. "
         "Uretim oncesi release signing yapilandirilmali.")
    code("signingConfigs {\n  release {\n    signingConfig signingConfigs.debug // TODO: Change this\n  }\n}")

    subsection("3.2 Tekrarli Entry Point Dosyalari")
    body("lib/main_stg.dart ve lib/main_staging.dart dosyalari tamamen ayni icerige sahip. "
         "Birisi silinmeli.")

    subsection("3.3 Yazim Hatalari - passenger_tracking_screen.dart")
    bullet("onTripaistoryTap -> onTripHistoryTap olmali (satir 54)")
    bullet("screenaeight -> screenHeight olmali (satir 941)")
    bullet("panelaeight -> panelHeight olmali (satir 944)")
    bullet("auman-readable -> human-readable olmali (satir 77)")

    subsection("3.4 Backend API Test ve CI Eksikligi")
    body("backend/api/ dizininde hic test dosyasi yok. package.json'da test script'i tanimli degil. "
         ".github/workflows/ altinda backend/api icin CI pipeline bulunmuyor.")
    info_box("RISK: Backend API'de regresyon hatalari uretime cikabilir.", YELLOW_BG)

    subsection("3.5 Rate Limiting Eksikligi")
    body("Backend API'de route preview endpoint'i disinda hicbir endpoint rate limiting'e sahip degil. "         "Login, password reset, member creation gibi hassas endpoint'ler brute-force saldirilarina acik.")

    subsection("3.6 Graceful Shutdown Eksikligi")
    body("Node.js server SIGTERM/SIGINT sinyallerini yakalamiyor. Surec sonlandirildiginda "
         "devam eden istekler dusuyor, PostgreSQL pool drenajlanmiyor, Firebase baglantilari kapanmiyor.")

    story.append(PageBreak())

    # === 4. FLUTTER UYGULAMA SORUNLARI ===
    section_header("4. Flutter Uygulama Sorunlari")

    subsection("4.1 Map Placeholder - active_trip_screen.dart")
    body("Aktif sefer ekrani gercek bir harita widget'i yerine ozel bir CustomPainter (_MapPlaceholderPattern) "
         "kullaniyor. Surucunun aktif sefer sirasinda canli harita gormesi beklenirken, sadece statik bir cizim gosteriliyor.")
    info_box("Bu durum 'Temporary compatibility surface for legacy map-mode tests' aciklamasiyla isaretlenmis.", YELLOW_BG)

    subsection("4.2 Hardcoded Demo Veri - driver_home_screen.dart")
    body("Surucu ana ekrani sabitlenmis demo veriler iceriyor:")
    code("'Darica -> GOSB', '6 durak - 14 yolcu', '06:30'\n'Gebze -> TUZLA', '5 durak - 11 yolcu', '07:10'")
    body("Bu veriler backend'den gelen gercek verilerle degistirilmeli.")

    subsection("4.3 Router Dosya Sayisi Fazla")
    body("lib/app/router/ dizininde 34 dosya bulunuyor. Bir cogu router_*_helpers.dart dosyalari. "
         "Navigasyon mantigi asiri parcalanmis, izlenebilirligi zorlasiyor.")

    subsection("4.4 Impeller Devre Disi (Android)")
    body("AndroidManifest.xml'de EnableImpeller=false olarak ayarlanmis. "
         "Flutter'in yeni render motoru devre disi, Skia'ya dusuluyor. Performans etkisi olabilir.")

    subsection("4.5 compileSdkVersion 36")
    body("Android build.gradle'da compileSdkVersion 36 (Android 16 preview) olarak ayarlanmis. "
         "Bu henuz stabil degil, build sorunlarina yol acabilir.")

    subsection("4.6 Firebase Config Dosyalari Eksik")
    body("lib/firebase/ dizini bos (gitignore'a eklenmis). google-services.json ve GoogleService-Info.plist "
         "dosyalari yerel olarak veya CI/CD ile saglanmali. Yeni gelistiriciler icin kurulum engeli olusturur.")

    subsection("4.7 dependency_overrides Kullanimi")
    body("pubspec.yaml'da geolocator_android: 4.5.0 olarak override edilmis. "
         "Bu muhtemelen bir bug veya uyumluluk sorunu nedeniyle yapilmis, kok neden dokumante edilmeli.")

    story.append(PageBreak())

    # === 5. BACKEND API SORUNLARI ===
    section_header("5. Backend API Sorunlari")

    subsection("5.1 Monolitik server.js (1767 satir)")
    body("Tum routing mantigi tek bir dosyada ~30 path extraction fonksiyonu ve ~50 route handler ile yonetiliyor. "
         "Single Responsibility Principle ihlal ediliyor, test edilmesi zorlasiyor.")

    subsection("5.2 Router Abstraction Eksikligi")
    body("Her route if zincirleri ile eslestiriliyor. Express Router benzeri bir router abstraction yok. "
         "Routing hatalari veya edge case'lerin gozden kacmasi kolay.")

    subsection("5.3 Input Validation Schema Eksikligi")
    body("Giris validasyonu manuel fonksiyonlarla yapiliyor. Functions dizini zod kullaniyor ancak "
         "backend/api kullanmiyor. Manuel validasyon hata yapmaya acik.")

    subsection("5.4 Sessiz Hata Yutma")
    body("company-driver-mutations.js:202'de Firebase custom claims set islemi sessizce yutuluyor:")
    code("try {\n  await admin.auth().setCustomUserClaims(uid, {...});\n} catch {}")
    body("Eger custom claims set edilmezse, surucu hesabi olusturulur ancak yetkilendirme sorunlari yasayabilir.")

    subsection("5.5 Bilinmeyen Method Davranisi")
    body("Bir path eslesir ancak HTTP method eslesmezse (orn. PUT /api/companies/{id}/profile), "
         "istek default bootstrap response'a dusuyor ve 200 status kodu donuyor. Yaniltici.")

    subsection("5.6 Harici Servisler icin Circuit Breaker Eksik")
    body("Map search servisi harici saglayicilari/PostgreSQL'i circuit breaker pattern'i olmadan cagiriyor. "
         "Harici servis down oldugunda her istek full timeout suresini bekleyecek.")

    subsection("5.7 Email Domain Hardcoded")
    body("Surucu hesaplarinin e-posta adresleri @neredeservis.app domain'i ile hardcoded olarak uretiliyor. "
         "Bu, ic altyapiyi ortaya cikariyor.")

    subsection("5.8 CORS Headers Yok")
    body("Server hicbir CORS header'i ayarlamiyor. Eger API farkli bir origin'den (website gibi) "
         "cagrilmak isteniyorsa, bu mesru istekleri engelleyecektir.")

    story.append(PageBreak())

    # === 6. GUVENLIK ACIKLARI DETAYLARI ===
    section_header("6. Guvenlik Aciklari Detaylari")

    subsection("6.1 Platform Owner Yetkilendirme - UID Only")
    body("Platform owner yetkilendirmesi sadece tek bir UID environment variable'ina guveniyor. "
         "Bu UID ele gecirilirse tam platform admin erisimi saglanir. Ikincil dogrulama (custom claims, MFA) yok.")

    subsection("6.2 Firebase API Key URL'de")
    body("auth-support.js ve platform-companies.js'de APP_WEB_API_KEY query parametresi olarak URL'e ekleniyor. "
         "Bu, server log'lari, proxy log'lari ve browser history'de gorunur hale getirir.")

    subsection("6.3 File Upload Path Traversal Kismi Koruma")
    body("company-logo-storage.js'de path traversal kontrolu kismi. Dosya uzantisi validasyonu "
         "okuma sirasinda yapilmiyor. Saldirgan farkli uzantili dosya saklayabilir.")

    subsection("6.4 Request Timeout Yapilandirmasi Yok")
    body("Native HTTP server'da timeout yapilandirmasi yok. Uzun suren istekler (Firebase transaction, "
         "PostgreSQL query) baglantilari surekli acik tutabilir, kaynak tukenmesine yol acabilir.")

    subsection("6.5 SSH Key Dosyasi")
    body("Proje kok dizininde coolify_key dosyasi bulunuyor. Bu dosyanin gitignore'da oldugu "
         "dogrulanmali. Repo'ya push edilmis olmamali.")

    subsection("6.6 .env Dosyalari")
    body(".env.dev, .env.prod, .env.staging dosyalari disk uzerinde mevcut ve API key'ler iceriyor:")
    bullet("GOOGLE_MAPS_API_KEY")
    bullet("MAPBOX_PUBLIC_TOKEN")
    bullet("SENTRY_DSN / SENTRY_OTLP_ENDPOINT")
    bullet("ADAPTY_API_KEY (public_live_)")
    body("Bu dosyalar .gitignore'da listelenmis ancak disk uzerinde acikta duruyor.")

    story.append(PageBreak())

    # === 7. TEST DURUMU ===
    section_header("7. Test Durumu ve Kapsam")

    subsection("7.1 Flutter Test Durumu")
    make_table(
        ["Metrik", "Deger"],
        [
            [Paragraph("Toplam test dosyasi", styles['TableCell']), Paragraph("184", styles['TableCellCenter'])],
            [Paragraph("Integration test", styles['TableCell']), Paragraph("1 (smoke_startup_test.dart)", styles['TableCellCenter'])],
            [Paragraph("Calistirilabilir satir", styles['TableCell']), Paragraph("3,872", styles['TableCellCenter'])],
            [Paragraph("Kapsanan satir", styles['TableCell']), Paragraph("2,708", styles['TableCellCenter'])],
            [Paragraph("Test Kapsami", styles['TableCell']), Paragraph("69.9%", styles['TableCellCenter'])],
        ],
        [80*mm, 70*mm]
    )

    body("Testler kaynak yapisiyla uyumlu olarak organize edilmis:")
    bullet("test/ui/ - Ekran seviyesi widget testleri (17 dosya)")
    bullet("test/features/ - Feature seviyesi unit testler")
    bullet("test/domain/ - Domain model ve mapper testleri (22 dosya)")
    bullet("test/auth/ - Authentication testleri (10 dosya)")
    bullet("test/app/router/ - Router guard ve koordinator testleri (9 dosya)")
    bullet("test/golden/ - Golden image testleri")
    bullet("test/firebase/ - Firebase emulator contract testleri")

    subsection("7.2 Backend API Test Durumu")
    info_box("backend/api/ dizininde HIC test dosyasi yok. Test script'i tanimli degil.", RED_BG)

    subsection("7.3 Firebase Functions Test Durumu")
    body("functions/ dizininde test coverage mevcut:")
    bullet("callable_integration.test.mjs")
    bullet("phase6_acceptance.test.mjs")
    bullet("security_rules.test.mjs")
    bullet("Firebase emulator'lari ile calistiriliyor")

    story.append(PageBreak())

    # === 8. YAPILANDIRMA VE CI/CD ===
    section_header("8. Yapilandirma ve CI/CD Sorunlari")

    subsection("8.1 CI/CD Pipeline'lari")
    make_table(
        ["Workflow", "Tetikleyici", "Ne Yapiyor"],
        [
            [Paragraph("security-ci.yml", styles['TableCell']), Paragraph("PR, push main", styles['TableCell']), Paragraph("Gitleaks, npm audit", styles['TableCell'])],
            [Paragraph("functions-ci.yml", styles['TableCell']), Paragraph("PR, push main", styles['TableCell']), Paragraph("Lint, build, rules test", styles['TableCell'])],
            [Paragraph("web-ci.yml", styles['TableCell']), Paragraph("PR, push main", styles['TableCell']), Paragraph("pnpm lint, build", styles['TableCell'])],
            [Paragraph("mobile_ci.yml", styles['TableCell']), Paragraph("PR, push main", styles['TableCell']), Paragraph("Flutter analyze, test, build", styles['TableCell'])],
        ],
        [40*mm, 35*mm, 75*mm]
    )
    info_box("backend/api/ icin CI pipeline YOK - lint, test, security audit calismiyor.", RED_BG)

    subsection("8.2 Environment Variable Dokumantasyonu Yok")
    body("Backend API bircok environment variable'a guveniyor ancak hicbir .env.example veya "
         "dokumantasyon yok. Gerekli degiskenler:")
    bullet("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64")
    bullet("GOOGLE_CLOUD_PROJECT / FIREBASE_PROJECT_ID")
    bullet("PLATFORM_OWNER_UID")
    bullet("APP_WEB_API_KEY")
    bullet("TURNSTILE_SECRET_KEY")
    bullet("ROUTE_PREVIEW_SIGNING_SECRET")
    bullet("DATABASE_URL / POSTGRES_URL")
    bullet("UPLOAD_STORAGE_ROOT")
    bullet("MAP_SEARCH_PROVIDER")

    subsection("8.3 Startup Configuration Validation Yok")
    body("Server, gerekli environment variable'larin set edilip edilmedigini baslangicta dogrulamıyor. "
         "Eksik degiskenler runtime'da 500 hatasina neden oluyor, fail-fast yapilmiyor.")

    story.append(PageBreak())

    # === 9. BAGIMLILIK SORUNLARI ===
    section_header("9. Bagimlilik ve Versiyon Sorunlari")

    subsection("9.1 Flutter Bagimliliklari")
    make_table(
        ["Paket", "Mevcut", "Not"],
        [
            [Paragraph("flutter_lints", styles['TableCell']), Paragraph("4.0.0", styles['TableCellCenter']), Paragraph("Guncel: 5.x+", styles['TableCell'])],
            [Paragraph("http", styles['TableCell']), Paragraph("1.2.2", styles['TableCellCenter']), Paragraph("Guncel: 1.3.x", styles['TableCell'])],
            [Paragraph("workmanager", styles['TableCell']), Paragraph("0.6.0", styles['TableCellCenter']), Paragraph("Yeni Android surumlerde sorunlu", styles['TableCell'])],
            [Paragraph("mobile_scanner", styles['TableCell']), Paragraph("5.2.3", styles['TableCellCenter']), Paragraph("Guncelleme mevcut olabilir", styles['TableCell'])],
            [Paragraph("sentry_flutter", styles['TableCell']), Paragraph("8.14.0", styles['TableCellCenter']), Paragraph("Nispeten guncel", styles['TableCell'])],
        ],
        [45*mm, 30*mm, 75*mm]
    )

    subsection("9.2 Backend Bagimliliklari")
    make_table(
        ["Paket", "Mevcut", "Not"],
        [
            [Paragraph("firebase-admin", styles['TableCell']), Paragraph("^12.7.0", styles['TableCellCenter']), Paragraph("Guncel major versiyon", styles['TableCell'])],
            [Paragraph("pg", styles['TableCell']), Paragraph("^8.20.0", styles['TableCellCenter']), Paragraph("Guncel major versiyon", styles['TableCell'])],
        ],
        [45*mm, 30*mm, 75*mm]
    )
    body("Backend API'de dev dependency YOK - linting, formatting, test framework eksik.")

    story.append(PageBreak())

    # === 10. ONCELIKLI DUZELTME PLANI ===
    section_header("10. Oncelikli Duzeltme Plan")

    subsection("10.1 Tum Sorunlar Oncelik Sirasiyla")
    make_table(
        ["Oncelik", "Sorun", "Lokasyon", "Onlem"],
        [
            [Paragraph("P0", styles['BadgeP0']), Paragraph("Switch fall-through bug", styles['TableCell']), Paragraph("passenger_tracking_screen.dart:748", styles['TableCell']), Paragraph("break ekle veya switch expression kullan", styles['TableCell'])],
            [Paragraph("P0", styles['BadgeP0']), Paragraph("Zayif sifre uretimi", styles['TableCell']), Paragraph("company-driver-mutations.js:118", styles['TableCell']), Paragraph("crypto.randomBytes kullan", styles['TableCell'])],
            [Paragraph("P0", styles['BadgeP0']), Paragraph("Acik metin sifre saklama", styles['TableCell']), Paragraph("company-driver-mutations.js:168", styles['TableCell']), Paragraph("Firestore'dan kaldir", styles['TableCell'])],
            [Paragraph("P0", styles['BadgeP0']), Paragraph("Hardcoded API key'ler", styles['TableCell']), Paragraph("app_environment.dart:143", styles['TableCell']), Paragraph("Environment variable'a tasi", styles['TableCell'])],
            [Paragraph("P0", styles['BadgeP0']), Paragraph("PostgreSQL SSL devre disi", styles['TableCell']), Paragraph("map-db.js:49", styles['TableCell']), Paragraph("rejectUnauthorized: true yap", styles['TableCell'])],
            [Paragraph("P1", styles['BadgeP1']), Paragraph("Debug signing release", styles['TableCell']), Paragraph("android/app/build.gradle:65", styles['TableCell']), Paragraph("Release signing yapilandir", styles['TableCell'])],
            [Paragraph("P1", styles['BadgeP1']), Paragraph("Tekrarli entry point", styles['TableCell']), Paragraph("main_stg.dart / main_staging.dart", styles['TableCell']), Paragraph("Birini sil", styles['TableCell'])],
            [Paragraph("P1", styles['BadgeP1']), Paragraph("Yazim hatalari", styles['TableCell']), Paragraph("passenger_tracking_screen.dart", styles['TableCell']), Paragraph("Degisken adlarini duzelt", styles['TableCell'])],
            [Paragraph("P1", styles['BadgeP1']), Paragraph("Backend test/CI yok", styles['TableCell']), Paragraph("backend/api/", styles['TableCell']), Paragraph("Test + CI pipeline ekle", styles['TableCell'])],
            [Paragraph("P1", styles['BadgeP1']), Paragraph("Rate limiting yok", styles['TableCell']), Paragraph("server.js", styles['TableCell']), Paragraph("Rate limiting ekle", styles['TableCell'])],
            [Paragraph("P1", styles['BadgeP1']), Paragraph("Graceful shutdown yok", styles['TableCell']), Paragraph("server.js", styles['TableCell']), Paragraph("SIGTERM handler ekle", styles['TableCell'])],
            [Paragraph("P2", styles['BadgeP2']), Paragraph("Map placeholder", styles['TableCell']), Paragraph("active_trip_screen.dart", styles['TableCell']), Paragraph("Gercek map widget ekle", styles['TableCell'])],
            [Paragraph("P2", styles['BadgeP2']), Paragraph("Hardcoded demo veri", styles['TableCell']), Paragraph("driver_home_screen.dart", styles['TableCell']), Paragraph("Backend'den veri cek", styles['TableCell'])],
            [Paragraph("P2", styles['BadgeP2']), Paragraph("Router asiri parcali", styles['TableCell']), Paragraph("lib/app/router/ (34 dosya)", styles['TableCell']), Paragraph("Birlestir ve sadelestir", styles['TableCell'])],
            [Paragraph("P2", styles['BadgeP2']), Paragraph("Input validation eksik", styles['TableCell']), Paragraph("backend/api/src/", styles['TableCell']), Paragraph("zod benzeri schema ekle", styles['TableCell'])],
            [Paragraph("P3", styles['BadgeP3']), Paragraph("flutter_lints eski", styles['TableCell']), Paragraph("pubspec.yaml:74", styles['TableCell']), Paragraph("5.x'e guncelle", styles['TableCell'])],
            [Paragraph("P3", styles['BadgeP3']), Paragraph("compileSdkVersion 36", styles['TableCell']), Paragraph("android/app/build.gradle", styles['TableCell']), Paragraph("35'e dusur (stabil)", styles['TableCell'])],
            [Paragraph("P3", styles['BadgeP3']), Paragraph("Impeller devre disi", styles['TableCell']), Paragraph("AndroidManifest.xml:18", styles['TableCell']), Paragraph("true yap (test et)", styles['TableCell'])],
            [Paragraph("P3", styles['BadgeP3']), Paragraph("Test kapsam %69.9", styles['TableCell']), Paragraph("coverage/", styles['TableCell']), Paragraph("%80+ hedefle", styles['TableCell'])],
        ],
        [20*mm, 40*mm, 40*mm, 50*mm]
    )

    subsection("10.2 Guvenlik Onlemleri")
    bullet("Tum API key'leri environment variable'lara tasinmali")
    bullet("crypto.randomBytes() ile guclu sifre uretimi yapilmali")
    bullet("PostgreSQL SSL'de rejectUnauthorized: true olmali")
    bullet("Rate limiting tum hassas endpoint'lere eklenmeli")
    bullet("Request timeout yapilandirilmali")
    bullet("CORS headers ayarlanmali veya reverse proxy'de yonetilmeli")
    bullet("coolify_key dosyasinin gitignore'da oldugu dogrulanmali")

    subsection("10.3 CI/CD Iyilestirmeleri")
    bullet("backend/api/ icin yeni CI workflow olusturulmali")
    bullet("En azindan: npm audit, lint, basic smoke test")
    bullet("Test coverage raporlari CI'da uretilmeli")
    bullet(".env.example dosyasi olusturulmali")

    story.append(Spacer(1, 15*mm))
    info_box("Bu rapor otomatik olarak olusturulmustur. Tum bulgular manuel olarak dogrulanmalidir.", BLUE_BG)

    # Build
    doc.build(story)
    print(f"PDF raporu olusturuldu: {OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
