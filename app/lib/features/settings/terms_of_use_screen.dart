import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Terms of Use Screen
class TermsOfUseScreen extends StatelessWidget {
  const TermsOfUseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: AppColors.textPrimaryLight,
            size: 20,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Kullanım Şartları',
          style: AppTextStyles.title(isDark: false),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Kullanım Şartları',
                style: AppTextStyles.headline(isDark: false),
              ),
              const SizedBox(height: 16),
              Text(
                _getTermsOfUseText(),
                style: AppTextStyles.body(isDark: false),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTermsOfUseText() {
    return '''Son Güncelleme: 27 Ocak 2026

1ndirim mobil uygulamasını ("Uygulama") kullanarak, aşağıdaki Kullanım Koşullarını kabul etmiş sayılırsınız.

1. KULLANIM LİSANSI

1ndirim size, kişisel, ticari olmayan amaçlarla uygulamayı kullanmak için sınırlı, münhasır olmayan, devredilemez bir lisans verir.

2. KULLANIM KISITLAMALARI

Uygulamayı kullanırken aşağıdakileri yapmayı kabul etmezsiniz:
- Uygulamayı yasadışı veya yetkisiz amaçlarla kullanmak
- Uygulamanın güvenliğini veya bütünlüğünü ihlal etmeye çalışmak
- Uygulamayı tersine mühendislik yapmak, değiştirmek veya kopyalamak
- Otomatik sistemler kullanarak uygulamaya erişmek

3. KAMPANYA BİLGİLERİ

3.1. Bilgi Doğruluğu
- Uygulama, banka ve operatörlerden toplanan kampanya bilgilerini gösterir
- Kampanya bilgilerinin doğruluğunu garanti edemeyiz
- Kampanya detayları için ilgili banka/operatör web sitesini kontrol etmenizi öneririz

3.2. Kampanya Değişiklikleri
- Kampanyalar zaman içinde değişebilir veya sona erebilir
- Uygulama, kampanya değişikliklerini mümkün olan en kısa sürede güncellemeye çalışır

4. KULLANICI HESAPLARI

4.1. Hesap Güvenliği
- Hesap bilgilerinizi gizli tutmak sizin sorumluluğunuzdadır
- Şüpheli aktivite fark ederseniz, derhal bizimle iletişime geçin

4.2. Hesap İptali
- Hesabınızı istediğiniz zaman iptal edebilirsiniz

5. FİKRİ MÜLKİYET HAKLARI

5.1. Uygulama İçeriği
- Uygulama içeriği bizim mülkiyetimizdedir
- Bu içeriği izinsiz kopyalayamaz, dağıtamaz veya kullanamazsınız

5.2. Üçüncü Taraf İçerik
- Uygulama, banka ve operatör logoları gibi üçüncü taraf içerik içerir
- Bu içerikler ilgili sahiplerinin mülkiyetindedir

6. HİZMET KESİNTİLERİ

- Uygulama, bakım, güncelleme veya teknik sorunlar nedeniyle geçici olarak kullanılamayabilir
- Hizmet kesintilerinden sorumlu tutulamayız

7. SORUMLULUK REDDİ

7.1. Genel Sorumluluk Reddi
- Uygulama "olduğu gibi" sunulmaktadır
- Uygulamanın kesintisiz, hatasız veya güvenli olacağını garanti edemeyiz

7.2. Kampanya Bilgileri Sorumluluğu
- Kampanya bilgilerinin doğruluğunu garanti edemeyiz
- Kampanya koşulları için ilgili banka/operatörü kontrol etmeniz gerekir

8. TAZMİNAT

Uygulamayı kullanımınızdan kaynaklanan herhangi bir zarar, kayıp veya masraftan sorumlu olmadığımızı kabul edersiniz.

9. HİZMET DEĞİŞİKLİKLERİ VE SONLANDIRMA

- Uygulamayı herhangi bir zamanda değiştirme, askıya alma veya sonlandırma hakkımız saklıdır
- Hizmet değişiklikleri için önceden bildirim yapmaya çalışırız

10. KULLANIM KOŞULLARI DEĞİŞİKLİKLERİ

Bu Kullanım Koşullarını zaman zaman güncelleyebiliriz. Değişiklikler yapıldığında uygulama içinde bildirim göndereceğiz.

11. UYGULANABİLİR HUKUK

Bu Kullanım Koşulları, Türkiye Cumhuriyeti yasalarına tabidir.

12. İLETİŞİM

Kullanım Koşulları hakkında sorularınız varsa:
E-posta: support@birdir1.com
Web: https://1indirim.birdir1.com/support

KABUL: Bu uygulamayı kullanarak, bu Kullanım Koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi onaylarsınız.''';
  }
}
