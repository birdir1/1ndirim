import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/source_model.dart';

/// Icon name string'den IconData'ya çeviren helper
IconData _getIconData(String iconName) {
  switch (iconName) {
    case 'account_balance':
      return Icons.account_balance;
    case 'payments':
      return Icons.payments;
    case 'account_balance_wallet':
      return Icons.account_balance_wallet;
    case 'cell_tower':
      return Icons.cell_tower;
    case 'signal_cellular_alt':
      return Icons.signal_cellular_alt;
    case 'router':
      return Icons.router;
    case 'credit_card':
      return Icons.credit_card;
    case 'savings':
      return Icons.savings;
    default:
      return Icons.business;
  }
}

/// Source Repository - Dev verileri ve source işlemlerini yönetir
/// SharedPreferences erişimi sadece burada yapılır
class SourceRepository {
  // SharedPreferences keys
  static const String _keySelectedSources = 'selected_sources';
  static const String _keySelectedSegments = 'selected_segments';

  // SharedPreferences instance
  static SharedPreferences? _prefs;

  /// SharedPreferences instance'ını başlatır
  static Future<void> _init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Tüm kaynakları (segments ile) getirir
  static List<SourceModel> getAllSourcesWithSegments() {
    final sources = [
      // KAMU BANKALARI
      SourceModel(
        id: 'ziraat',
        name: 'Ziraat Bankası',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF16A34A),
        segments: [
          SourceSegment(id: 'ziraat_bankkart', name: 'Bankkart'),
          SourceSegment(id: 'ziraat_bankkart_basak', name: 'Bankkart Başak'),
          SourceSegment(
            id: 'ziraat_bankkart_business',
            name: 'Bankkart Business',
          ),
          SourceSegment(id: 'ziraat_bankkart_genc', name: 'Bankkart Genç'),
          SourceSegment(
            id: 'ziraat_bankkart_prestij',
            name: 'Bankkart Prestij',
          ),
          SourceSegment(
            id: 'ziraat_bankkart_platinum',
            name: 'Bankkart Platinum',
          ),
        ],
      ),
      SourceModel(
        id: 'halkbank',
        name: 'Halkbank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF2563EB),
        segments: [
          SourceSegment(id: 'halkbank_paraf', name: 'Paraf'),
          SourceSegment(id: 'halkbank_paraf_genc', name: 'Paraf Genç'),
          SourceSegment(id: 'halkbank_paraf_platinum', name: 'Paraf Platinum'),
          SourceSegment(id: 'halkbank_paraf_business', name: 'Paraf Business'),
          SourceSegment(id: 'halkbank_paraf_esnaf', name: 'Paraf Esnaf'),
        ],
      ),
      SourceModel(
        id: 'vakifbank',
        name: 'VakıfBank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF9333EA),
        segments: [
          SourceSegment(id: 'vakifbank_worldcard', name: 'Worldcard'),
          SourceSegment(id: 'vakifbank_world_platinum', name: 'World Platinum'),
          SourceSegment(id: 'vakifbank_world_business', name: 'World Business'),
          SourceSegment(id: 'vakifbank_troy_kart', name: 'VakıfBank Troy Kart'),
          SourceSegment(
            id: 'vakifbank_banka_karti',
            name: 'VakıfBank Banka Kartı',
          ),
        ],
      ),

      // ÖZEL BANKALAR
      SourceModel(
        id: 'akbank',
        name: 'Akbank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFDC2626),
        segments: [
          SourceSegment(id: 'akbank_axess', name: 'Axess'),
          SourceSegment(id: 'akbank_axess_platinum', name: 'Axess Platinum'),
          SourceSegment(id: 'akbank_wings', name: 'Wings'),
          SourceSegment(id: 'akbank_wings_black', name: 'Wings Black'),
          SourceSegment(id: 'akbank_free', name: 'Free (Genç / Öğrenci)'),
          SourceSegment(id: 'akbank_axess_business', name: 'Axess Business'),
          SourceSegment(id: 'akbank_kart', name: 'Akbank Kart'),
        ],
      ),
      SourceModel(
        id: 'yapikredi',
        name: 'Yapı Kredi',
        type: 'bank',
        icon: _getIconData('credit_card'),
        color: const Color(0xFF9333EA),
        segments: [
          SourceSegment(id: 'yapikredi_worldcard', name: 'Worldcard'),
          SourceSegment(id: 'yapikredi_world_platinum', name: 'World Platinum'),
          SourceSegment(id: 'yapikredi_world_elite', name: 'World Elite'),
          SourceSegment(id: 'yapikredi_world_business', name: 'World Business'),
          SourceSegment(id: 'yapikredi_adios', name: 'Adios'),
          SourceSegment(id: 'yapikredi_adios_premium', name: 'Adios Premium'),
          SourceSegment(
            id: 'yapikredi_banka_karti',
            name: 'Yapı Kredi Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'isbank',
        name: 'İş Bankası',
        type: 'bank',
        icon: _getIconData('account_balance_wallet'),
        color: const Color(0xFF2563EB),
        segments: [
          SourceSegment(id: 'isbank_maximum', name: 'Maximum'),
          SourceSegment(
            id: 'isbank_maximum_platinum',
            name: 'Maximum Platinum',
          ),
          SourceSegment(id: 'isbank_maximum_black', name: 'Maximum Black'),
          SourceSegment(
            id: 'isbank_maximum_aidatsiz',
            name: 'Maximum Aidatsız',
          ),
          SourceSegment(id: 'isbank_maximum_genc', name: 'Maximum Genç'),
          SourceSegment(
            id: 'isbank_maximum_business',
            name: 'Maximum Business',
          ),
          SourceSegment(id: 'isbank_bankamatik_kart', name: 'Bankamatik Kart'),
          SourceSegment(
            id: 'isbank_maximum_bankamatik',
            name: 'Maximum Bankamatik',
          ),
        ],
      ),
      SourceModel(
        id: 'garanti',
        name: 'Garanti BBVA',
        type: 'bank',
        icon: _getIconData('payments'),
        color: const Color(0xFF16A34A),
        segments: [
          SourceSegment(id: 'garanti_bonus', name: 'Bonus'),
          SourceSegment(id: 'garanti_bonus_gold', name: 'Bonus Gold'),
          SourceSegment(id: 'garanti_bonus_platinum', name: 'Bonus Platinum'),
          SourceSegment(id: 'garanti_bonus_business', name: 'Bonus Business'),
          SourceSegment(id: 'garanti_shopfly', name: 'Shop&Fly'),
          SourceSegment(
            id: 'garanti_shopfly_platinum',
            name: 'Shop&Fly Platinum',
          ),
          SourceSegment(
            id: 'garanti_shopfly_miles_smiles',
            name: 'Shop&Fly Miles&Smiles',
          ),
          SourceSegment(id: 'garanti_paracard', name: 'Paracard'),
          SourceSegment(id: 'garanti_paracard_bonus', name: 'Paracard Bonus'),
        ],
      ),
      SourceModel(
        id: 'qnbfinansbank',
        name: 'QNB Finansbank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF0D9488),
        segments: [
          SourceSegment(id: 'qnb_cardfinans', name: 'CardFinans'),
          SourceSegment(
            id: 'qnb_cardfinans_platinum',
            name: 'CardFinans Platinum',
          ),
          SourceSegment(id: 'qnb_cardfinans_gold', name: 'CardFinans Gold'),
          SourceSegment(
            id: 'qnb_cardfinans_aidatsiz',
            name: 'CardFinans Aidatsız',
          ),
          SourceSegment(
            id: 'qnb_cardfinans_business',
            name: 'CardFinans Business',
          ),
          SourceSegment(id: 'qnb_enpara_kart', name: 'Enpara.com Kart'),
        ],
      ),
      SourceModel(
        id: 'denizbank',
        name: 'DenizBank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF38BDF8),
        segments: [
          SourceSegment(id: 'denizbank_bonus', name: 'Bonus'),
          SourceSegment(id: 'denizbank_bonus_platinum', name: 'Bonus Platinum'),
          SourceSegment(id: 'denizbank_bonus_business', name: 'Bonus Business'),
          SourceSegment(
            id: 'denizbank_banka_karti',
            name: 'DenizBank Banka Kartı',
          ),
          SourceSegment(id: 'denizbank_genc_kart', name: 'DenizBank Genç Kart'),
        ],
      ),
      SourceModel(
        id: 'teb',
        name: 'TEB',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFEA580C),
        segments: [
          SourceSegment(id: 'teb_bonus', name: 'Bonus'),
          SourceSegment(id: 'teb_bonus_platinum', name: 'Bonus Platinum'),
          SourceSegment(id: 'teb_bonus_business', name: 'Bonus Business'),
          SourceSegment(id: 'teb_banka_karti', name: 'TEB Banka Kartı'),
          SourceSegment(id: 'teb_cepteteb_kart', name: 'CEPTETEB Kart'),
        ],
      ),
      SourceModel(
        id: 'ingbank',
        name: 'ING Bank',
        type: 'bank',
        icon: _getIconData('savings'),
        color: const Color(0xFFEA580C),
        segments: [
          SourceSegment(id: 'ing_bonus', name: 'ING Bonus'),
          SourceSegment(id: 'ing_bonus_platinum', name: 'ING Bonus Platinum'),
          SourceSegment(id: 'ing_banka_karti', name: 'ING Banka Kartı'),
        ],
      ),
      SourceModel(
        id: 'sekerbank',
        name: 'Şekerbank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFCA8A04),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'sekerbank_bonus', name: 'Bonus'),
          SourceSegment(id: 'sekerbank_bonus_platinum', name: 'Bonus Platinum'),
          SourceSegment(
            id: 'sekerbank_banka_karti',
            name: 'Şekerbank Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'fibabanka',
        name: 'Fibabanka',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFEF4444),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'fibabanka_bonus', name: 'Bonus'),
          SourceSegment(id: 'fibabanka_bonus_platinum', name: 'Bonus Platinum'),
          SourceSegment(
            id: 'fibabanka_banka_karti',
            name: 'Fibabanka Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'anadolubank',
        name: 'Anadolubank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF9333EA),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'anadolubank_worldcard', name: 'Worldcard'),
          SourceSegment(
            id: 'anadolubank_world_platinum',
            name: 'World Platinum',
          ),
          SourceSegment(
            id: 'anadolubank_banka_karti',
            name: 'Anadolubank Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'alternatifbank',
        name: 'Alternatif Bank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF2563EB),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'alternatif_bonus', name: 'Bonus'),
          SourceSegment(
            id: 'alternatif_bonus_platinum',
            name: 'Bonus Platinum',
          ),
          SourceSegment(
            id: 'alternatif_banka_karti',
            name: 'Alternatif Bank Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'odeabank',
        name: 'OdeaBank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF16A34A),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'odeabank_odeacard', name: 'OdeaCard'),
          SourceSegment(
            id: 'odeabank_odeacard_platinum',
            name: 'OdeaCard Platinum',
          ),
          SourceSegment(
            id: 'odeabank_banka_karti',
            name: 'OdeaBank Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'icbc',
        name: 'ICBC Turkey Bank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFDC2626),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'icbc_card', name: 'ICBC Card'),
          SourceSegment(id: 'icbc_banka_karti', name: 'ICBC Banka Kartı'),
        ],
      ),
      SourceModel(
        id: 'burganbank',
        name: 'Burgan Bank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF0D9488),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'burgan_on_dijital_kart', name: 'On Dijital Kart'),
          SourceSegment(
            id: 'burgan_banka_karti',
            name: 'Burgan Bank Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'hsbc',
        name: 'HSBC Türkiye',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFDC2626),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'hsbc_advantage', name: 'Advantage'),
          SourceSegment(
            id: 'hsbc_advantage_platinum',
            name: 'Advantage Platinum',
          ),
          SourceSegment(id: 'hsbc_premier_kart', name: 'HSBC Premier Kart'),
          SourceSegment(id: 'hsbc_banka_karti', name: 'HSBC Banka Kartı'),
        ],
      ),

      // KATILIM BANKALARI
      SourceModel(
        id: 'kuveytturk',
        name: 'Kuveyt Türk',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFCA8A04),
        segments: [
          SourceSegment(id: 'kuveyt_saglam_kart', name: 'Sağlam Kart'),
          SourceSegment(
            id: 'kuveyt_saglam_kart_platinum',
            name: 'Sağlam Kart Platinum',
          ),
          SourceSegment(
            id: 'kuveyt_saglam_kart_business',
            name: 'Sağlam Kart Business',
          ),
          SourceSegment(
            id: 'kuveyt_banka_karti',
            name: 'Kuveyt Türk Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'albarakaturk',
        name: 'Albaraka Türk',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF16A34A),
        segments: [
          SourceSegment(id: 'albaraka_world', name: 'Albaraka World'),
          SourceSegment(id: 'albaraka_platinum', name: 'Albaraka Platinum'),
          SourceSegment(
            id: 'albaraka_banka_karti',
            name: 'Albaraka Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'turkiyefinans',
        name: 'Türkiye Finans',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF2563EB),
        segments: [
          SourceSegment(id: 'turkiyefinans_finanscard', name: 'FinansCard'),
          SourceSegment(
            id: 'turkiyefinans_finanscard_platinum',
            name: 'FinansCard Platinum',
          ),
          SourceSegment(
            id: 'turkiyefinans_banka_karti',
            name: 'Türkiye Finans Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'vakifkatilim',
        name: 'Vakıf Katılım',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF9333EA),
        segments: [
          SourceSegment(id: 'vakifkatilim_kart', name: 'Vakıf Katılım Kart'),
          SourceSegment(
            id: 'vakifkatilim_platinum',
            name: 'Vakıf Katılım Platinum',
          ),
        ],
      ),
      SourceModel(
        id: 'ziraatkatilim',
        name: 'Ziraat Katılım',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF16A34A),
        segments: [
          SourceSegment(
            id: 'ziraatkatilim_katilim_bankkart',
            name: 'Katılım Bankkart',
          ),
          SourceSegment(
            id: 'ziraatkatilim_katilim_bankkart_platinum',
            name: 'Katılım Bankkart Platinum',
          ),
        ],
      ),
      SourceModel(
        id: 'emlakkatilim',
        name: 'Emlak Katılım',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFEF4444),
        segments: [
          SourceSegment(id: 'emlakkatilim_kart', name: 'Emlak Katılım Kart'),
          SourceSegment(
            id: 'emlakkatilim_banka_karti',
            name: 'Emlak Katılım Banka Kartı',
          ),
        ],
      ),

      // DİJİTAL BANKALAR
      SourceModel(
        id: 'enpara',
        name: 'Enpara',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF0D9488),
        segments: [
          SourceSegment(id: 'enpara_kredi_karti', name: 'Enpara Kredi Kartı'),
          SourceSegment(id: 'enpara_banka_karti', name: 'Enpara Banka Kartı'),
        ],
      ),
      SourceModel(
        id: 'cepteteb',
        name: 'CEPTETEB',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFEA580C),
        segments: [
          SourceSegment(
            id: 'cepteteb_kredi_karti',
            name: 'CEPTETEB Kredi Kartı',
          ),
          SourceSegment(
            id: 'cepteteb_banka_karti',
            name: 'CEPTETEB Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'hayatfinans',
        name: 'Hayat Finans',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF38BDF8),
        hasScraper: true,
        planned: false,
        segments: [
          SourceSegment(id: 'hayatfinans_kart', name: 'Hayat Finans Kart'),
          SourceSegment(
            id: 'hayatfinans_banka_karti',
            name: 'Hayat Finans Banka Kartı',
          ),
        ],
      ),
      SourceModel(
        id: 'tombank',
        name: 'TOM Bank',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF9333EA),
        hasScraper: true,
        planned: false,
        noCampaignPage: false,
        segments: [
          SourceSegment(id: 'tombank_tom_kart', name: 'TOM Kart'),
          SourceSegment(id: 'tombank_tom_sanal_kart', name: 'TOM Sanal Kart'),
        ],
      ),
      SourceModel(
        id: 'nkolay',
        name: 'N Kolay',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF2563EB),
        segments: [
          SourceSegment(id: 'nkolay_kart', name: 'N Kolay Kart'),
          SourceSegment(id: 'nkolay_sanal_kart', name: 'N Kolay Sanal Kart'),
        ],
      ),
      SourceModel(
        id: 'papara',
        name: 'Papara',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFF16A34A),
        segments: [
          SourceSegment(id: 'papara_black_card', name: 'Papara Black Card'),
          SourceSegment(id: 'papara_rose', name: 'Papara Rose'),
          SourceSegment(id: 'papara_metal', name: 'Papara Metal'),
          SourceSegment(id: 'papara_sanal_kart', name: 'Papara Sanal Kart'),
        ],
      ),
      SourceModel(
        id: 'tosla',
        name: 'Tosla',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFFF3D57),
        segments: [
          SourceSegment(id: 'tosla_kart', name: 'Tosla Kart'),
          SourceSegment(id: 'tosla_sanal_kart', name: 'Tosla Sanal Kart'),
        ],
      ),
      SourceModel(
        id: 'paycell',
        name: 'Paycell',
        type: 'bank',
        icon: _getIconData('account_balance'),
        color: const Color(0xFFDC2626),
        segments: [
          SourceSegment(id: 'paycell_kart', name: 'Paycell Kart'),
          SourceSegment(id: 'paycell_sanal_kart', name: 'Paycell Sanal Kart'),
        ],
      ),

      // ANA OPERATÖRLER
      SourceModel(
        id: 'turkcell',
        name: 'Turkcell',
        type: 'operator',
        icon: _getIconData('cell_tower'),
        color: const Color(0xFFCA8A04),
        segments: [
          SourceSegment(id: 'turkcell_faturali_hat', name: 'Faturalı Hat'),
          SourceSegment(id: 'turkcell_faturasiz_hat', name: 'Faturasız Hat'),
          SourceSegment(id: 'turkcell_platinum', name: 'Turkcell Platinum'),
          SourceSegment(id: 'turkcell_business', name: 'Turkcell Business'),
        ],
      ),
      SourceModel(
        id: 'vodafone',
        name: 'Vodafone',
        type: 'operator',
        icon: _getIconData('signal_cellular_alt'),
        color: const Color(0xFFEF4444),
        segments: [
          SourceSegment(id: 'vodafone_faturali', name: 'Vodafone Faturalı'),
          SourceSegment(id: 'vodafone_faturasiz', name: 'Vodafone Faturasız'),
          SourceSegment(id: 'vodafone_red', name: 'Vodafone Red'),
          SourceSegment(id: 'vodafone_business', name: 'Vodafone Business'),
        ],
      ),
      SourceModel(
        id: 'turktelekom',
        name: 'Türk Telekom',
        type: 'operator',
        icon: _getIconData('router'),
        color: const Color(0xFF38BDF8),
        segments: [
          SourceSegment(
            id: 'turktelekom_faturali',
            name: 'Türk Telekom Faturalı',
          ),
          SourceSegment(
            id: 'turktelekom_faturasiz',
            name: 'Türk Telekom Faturasız',
          ),
          SourceSegment(id: 'turktelekom_prime', name: 'Türk Telekom Prime'),
          SourceSegment(
            id: 'turktelekom_business',
            name: 'Türk Telekom Business',
          ),
        ],
      ),

      // MVNO - Türk Telekom Altyapısı
      SourceModel(
        id: 'bimcell',
        name: 'BİMcell',
        type: 'operator',
        icon: _getIconData('signal_cellular_alt'),
        color: const Color(0xFF38BDF8),
        segments: [],
      ),
      SourceModel(
        id: 'pttcell',
        name: 'PTTcell',
        type: 'operator',
        icon: _getIconData('signal_cellular_alt'),
        color: const Color(0xFF38BDF8),
        segments: [],
      ),
    ];

    // Alt seçenekleri (segments) kapat
    return sources.map((s) => s.copyWith(segments: [])).toList();
  }

  /// Tüm kaynakları (segments olmadan) getirir - onboarding için
  static List<SourceModel> getAllSources() {
    return getAllSourcesWithSegments()
        .map(
          (source) => SourceModel(
            id: source.id,
            name: source.name,
            type: source.type,
            icon: source.icon,
            color: source.color,
            segments: [],
            isSelected: source.isSelected,
          ),
        )
        .toList();
  }

  // ========== SharedPreferences Methods ==========

  /// Seçili kaynakları getirir
  static Future<List<String>> getSelectedSources() async {
    try {
      await _init();
      return _prefs!.getStringList(_keySelectedSources) ?? [];
    } catch (e) {
      return [];
    }
  }

  /// Seçili kaynakları kaydeder
  static Future<bool> saveSelectedSources(List<String> sources) async {
    try {
      await _init();
      return await _prefs!.setStringList(_keySelectedSources, sources);
    } catch (e) {
      return false;
    }
  }

  /// Seçili segmentleri getirir
  static Future<List<String>> getSelectedSegments() async {
    try {
      await _init();
      return _prefs!.getStringList(_keySelectedSegments) ?? [];
    } catch (e) {
      return [];
    }
  }

  /// Seçili segmentleri kaydeder
  static Future<bool> saveSelectedSegments(List<String> segments) async {
    try {
      await _init();
      return await _prefs!.setStringList(_keySelectedSegments, segments);
    } catch (e) {
      return false;
    }
  }

  /// Seçili kaynakları SourceModel listesi olarak getirir
  static Future<List<SourceModel>> getSelectedSourcesAsModels() async {
    try {
      final selectedSourceIds = await getSelectedSources();
      final selectedSegmentIds = await getSelectedSegments();
      final allSources = getAllSourcesWithSegments();

      return allSources.where((source) {
        // Kaynak ID'si seçili listede varsa
        if (selectedSourceIds.contains(source.id)) {
          return true;
        }

        // Veya en az bir segmenti seçiliyse
        return source.segments.any(
          (segment) => selectedSegmentIds.contains(segment.id),
        );
      }).toList();
    } catch (e) {
      return [];
    }
  }
}
