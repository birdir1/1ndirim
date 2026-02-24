import 'package:flutter/material.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/widgets/screen_shell.dart';
import '../../core/widgets/section_card.dart';

/// Privacy Policy Screen
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenShell(
      title: 'Gizlilik Politikası',
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 24, top: 8),
        child: SectionCard(
          padding: const EdgeInsets.all(20),
          child: Text(
            _getPrivacyPolicyText(),
            style: AppTextStyles.body(isDark: false),
          ),
        ),
      ),
    );
  }

  String _getPrivacyPolicyText() {
    return '''Son Güncelleme: 27 Ocak 2026

1ndirim ("Biz", "Bizim", "Uygulama") olarak, kullanıcılarımızın gizliliğini korumayı taahhüt ediyoruz. Bu Gizlilik Politikası, 1ndirim mobil uygulamasını ("Uygulama") kullandığınızda topladığımız, kullandığımız ve paylaştığımız bilgileri açıklar.

1. TOPLANAN BİLGİLER

1.1. Otomatik Olarak Toplanan Bilgiler
- Cihaz Bilgileri: Cihaz türü, işletim sistemi versiyonu, benzersiz cihaz tanımlayıcıları
- Kullanım Verileri: Uygulama içi etkileşimler, kampanya görüntüleme sayıları, kaynak seçimleri
- Teknik Bilgiler: IP adresi, tarayıcı türü, uygulama çökme raporları

1.2. Kullanıcı Tarafından Sağlanan Bilgiler
- Kaynak Seçimleri: İlgilendiğiniz banka ve operatör kaynakları
- Tercihler: Uygulama içi ayarlar ve tercihler

1.3. Üçüncü Taraf Servisleri
Uygulama aşağıdaki üçüncü taraf servisleri kullanabilir:
- Google Sign-In: Google hesabı ile giriş yapıldığında (isteğe bağlı)
- Apple Sign-In: Apple ID ile giriş yapıldığında (isteğe bağlı)
- Firebase: Uygulama analitiği ve çökme raporları

2. BİLGİLERİN KULLANIMI

Topladığımız bilgileri şu amaçlarla kullanırız:
- Hizmet Sağlama: Kampanya bilgilerini görüntüleme ve kişiselleştirme
- İyileştirme: Uygulama performansını ve kullanıcı deneyimini iyileştirme
- Analiz: Kullanım istatistikleri ve trend analizi
- Güvenlik: Uygulama güvenliğini sağlama ve kötüye kullanımı önleme

3. BİLGİLERİN PAYLAŞILMASI

Kişisel bilgilerinizi üçüncü taraflarla paylaşmıyoruz, ancak aşağıdaki durumlar hariç:
- Yasal Gereklilikler: Yasal bir zorunluluk veya mahkeme kararı durumunda
- Hizmet Sağlayıcılar: Uygulama hizmetlerini sağlamak için çalıştırdığımız güvenilir üçüncü taraf servisler
- İş Transferi: Şirket birleşmesi, devir veya varlık satışı durumunda

4. VERİ GÜVENLİĞİ

Verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri kullanıyoruz. Ancak, hiçbir internet tabanlı sistem %100 güvenli değildir.

5. VERİ SAKLAMA

Kullanıcı verilerinizi, hizmet sağlamak için gerekli olduğu sürece saklarız. Hesabınızı sildiğinizde veya uygulamayı kullanmayı bıraktığınızda, verilerinizi makul bir süre içinde sileriz.

6. ÇOCUKLARIN GİZLİLİĞİ

Uygulama 13 yaşın altındaki çocuklardan bilerek kişisel bilgi toplamaz.

7. KULLANICI HAKLARI

Aşağıdaki haklara sahipsiniz:
- Erişim: Kişisel verilerinize erişim talep etme
- Düzeltme: Yanlış veya eksik verilerinizi düzeltme
- Silme: Verilerinizin silinmesini talep etme
- İtiraz: Veri işlemeye itiraz etme
- Veri Taşınabilirliği: Verilerinizi başka bir servise aktarma

8. İLETİŞİM

Gizlilik politikamız hakkında sorularınız varsa:
E-posta: support@birdir1.com
Web: https://1ndirim.birdir1.com/support

9. KVKK

Türkiye Cumhuriyeti vatandaşları için, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamındaki haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.

Veri Sorumlusu: Birdir1 Bilişim Teknolojileri
E-posta: kvkk@birdir1.com''';
  }
}
