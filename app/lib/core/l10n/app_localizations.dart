import 'package:flutter/material.dart';

/// Uygulama yerelleştirme sınıfı
/// Tüm çeviriler burada tutulur
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'tr': {
      // Genel
      'app_name': '1ndirim',
      'loading': 'Yükleniyor...',
      'error': 'Hata',
      'success': 'Başarılı',
      'cancel': 'İptal',
      'save': 'Kaydet',
      'delete': 'Sil',
      'edit': 'Düzenle',
      'share': 'Paylaş',
      'refresh': 'Yenile',
      'search': 'Ara',
      'filter': 'Filtrele',
      'close': 'Kapat',
      'back': 'Geri',
      'next': 'İleri',
      'done': 'Tamam',
      'yes': 'Evet',
      'no': 'Hayır',
      'ok': 'Tamam',
      'retry': 'Tekrar Dene',
      'no_data': 'Veri bulunamadı',
      'no_internet': 'İnternet bağlantısı yok',
      'something_went_wrong': 'Bir şeyler ters gitti',

      // Ana Ekran
      'home': 'Ana Sayfa',
      'campaigns': 'Kampanyalar',
      'favorites': 'Favoriler',
      'profile': 'Profil',
      'expiring_soon': 'Yakında Bitecek',
      'view_all': 'Tümünü Gör',
      'no_campaigns': 'Kampanya bulunamadı',
      'no_favorites': 'Henüz favori kampanyanız yok',
      'my_favorites': 'Favorilerim',
      'login_required': 'Giriş yapmanız gerekiyor',
      'login_required_for_favorites':
          'Favorilerinizi görmek için giriş yapmanız gerekiyor',
      'error_occurred': 'Bir Hata Oluştu',
      'no_favorites_yet': 'Henüz Favoriniz Yok',
      'no_favorites_description':
          'Beğendiğiniz kampanyaları favorilere ekleyerek burada görebilirsiniz',
      'explore_campaigns': 'Kampanyaları Keşfet',
      'error_loading_favorites': 'Favoriler yüklenirken bir hata oluştu',

      // Kampanya Detay
      'campaign_details': 'Kampanya Detayları',
      'source': 'Kaynak',
      'expires_at': 'Bitiş Tarihi',
      'description': 'Açıklama',
      'add_to_favorites': 'Favorilere Ekle',
      'remove_from_favorites': 'Favorilerden Çıkar',
      'share_campaign': 'Kampanyayı Paylaş',
      'compare': 'Karşılaştır',
      'add_to_compare': 'Karşılaştırmaya Ekle',
      'remove_from_compare': 'Karşılaştırmadan Çıkar',
      'price_tracking': 'Fiyat Takibi',
      'track_price': 'Fiyatı Takip Et',
      'stop_tracking': 'Takibi Durdur',

      // Profil
      'my_profile': 'Profilim',
      'settings': 'Ayarlar',
      'language': 'Dil',
      'notifications': 'Bildirimler',
      'privacy': 'Gizlilik',
      'terms': 'Kullanım Koşulları',
      'about': 'Hakkında',
      'logout': 'Çıkış Yap',
      'login': 'Giriş Yap',
      'sign_in': 'Giriş Yap',
      'sign_out': 'Çıkış Yap',
      'stats': 'İstatistikler',
      'favorites_count': 'Favoriler',
      'comments_count': 'Yorumlar',
      'ratings_count': 'Puanlamalar',
      'points': 'Puan',
      'level': 'Seviye',
      'badges': 'Rozetler',
      'community': 'Topluluk',
      'price_tracking_menu': 'Fiyat Takibi',
      'blog': 'Blog & Rehberler',

      // Gamification
      'your_points': 'Puanlarınız',
      'your_level': 'Seviyeniz',
      'points_to_next_level': 'Sonraki seviyeye kalan puan',
      'earned_badges': 'Kazanılan Rozetler',
      'no_badges': 'Henüz rozet kazanmadınız',

      // Topluluk
      'leaderboard': 'Liderlik Tablosu',
      'community_stats': 'Topluluk İstatistikleri',
      'total_users': 'Toplam Kullanıcı',
      'total_favorites': 'Toplam Favori',
      'total_comments': 'Toplam Yorum',
      'total_ratings': 'Toplam Puanlama',
      'total_badges': 'Toplam Rozet',
      'total_points': 'Toplam Puan',
      'max_level': 'En Yüksek Seviye',
      'rank': 'Sıra',
      'you': 'Sen',

      // Takvim
      'calendar': 'Takvim',
      'campaign_calendar': 'Kampanya Takvimi',
      'select_date': 'Tarih Seçin',
      'no_campaigns_on_date': 'Bu tarihte kampanya yok',
      'campaigns_on_date': '{count} kampanya',

      // Karşılaştırma
      'compare_campaigns': 'Kampanyaları Karşılaştır',
      'select_campaigns': 'Kampanya Seçin',
      'min_compare': 'En az 2 kampanya seçmelisiniz',
      'max_compare': 'En fazla 3 kampanya karşılaştırabilirsiniz',
      'add_more': 'Daha Fazla Ekle',
      'remove': 'Kaldır',
      'clear_all': 'Tümünü Temizle',

      // Fiyat Takibi
      'tracked_campaigns': 'Takip Edilen Kampanyalar',
      'price_history': 'Fiyat Geçmişi',
      'current_price': 'Güncel Fiyat',
      'original_price': 'Orijinal Fiyat',
      'discount': 'İndirim',
      'price_change': 'Fiyat Değişimi',
      'price_increased': 'Fiyat Arttı',
      'price_decreased': 'Fiyat Azaldı',
      'price_stable': 'Fiyat Sabit',
      'no_tracked_campaigns': 'Takip edilen kampanya yok',

      // Blog
      'blog_title': 'Blog & Rehberler',
      'featured_posts': 'Öne Çıkanlar',
      'all_posts': 'Tüm Yazılar',
      'read_more': 'Devamını Oku',
      'views': 'Görüntülenme',
      'author': 'Yazar',
      'category': 'Kategori',
      'all_categories': 'Tümü',

      // Yorumlar
      'comments': 'Yorumlar',
      'add_comment': 'Yorum Ekle',
      'write_comment': 'Yorumunuzu yazın...',
      'no_comments': 'Henüz yorum yok',
      'comment_added': 'Yorum eklendi',
      'comment_deleted': 'Yorum silindi',

      // Puanlama
      'rating': 'Puanlama',
      'rate_campaign': 'Kampanyayı Puanla',
      'your_rating': 'Puanınız',
      'average_rating': 'Ortalama Puan',
      'no_ratings': 'Henüz puanlama yok',

      // Bildirimler
      'notifications': 'Bildirimler',
      'enable_notifications': 'Bildirimleri Etkinleştir',
      'campaign_notifications': 'Kampanya Bildirimleri',
      'price_drop_notifications': 'Fiyat Düşüş Bildirimleri',
      'new_campaign_notifications': 'Yeni Kampanya Bildirimleri',

      // Ayarlar
      'settings': 'Ayarlar',
      'app_settings': 'Uygulama Ayarları',
      'account_settings': 'Hesap Ayarları',
      'privacy_settings': 'Gizlilik Ayarları',
      'notification_settings': 'Bildirim Ayarları',
      'language_settings': 'Dil Ayarları',
      'select_language': 'Dil Seçin',

      // Hata Mesajları
      'error_loading': 'Yüklenirken hata oluştu',
      'error_saving': 'Kaydedilirken hata oluştu',
      'error_deleting': 'Silinirken hata oluştu',
      'error_network': 'Ağ hatası',
      'error_unauthorized': 'Yetkisiz erişim',
      'error_not_found': 'Bulunamadı',
      'error_server': 'Sunucu hatası',
    },
    'en': {
      // General
      'app_name': '1ndirim',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'cancel': 'Cancel',
      'save': 'Save',
      'delete': 'Delete',
      'edit': 'Edit',
      'share': 'Share',
      'refresh': 'Refresh',
      'search': 'Search',
      'filter': 'Filter',
      'close': 'Close',
      'back': 'Back',
      'next': 'Next',
      'done': 'Done',
      'yes': 'Yes',
      'no': 'No',
      'ok': 'OK',
      'retry': 'Retry',
      'no_data': 'No data found',
      'no_internet': 'No internet connection',
      'something_went_wrong': 'Something went wrong',

      // Home Screen
      'home': 'Home',
      'campaigns': 'Campaigns',
      'favorites': 'Favorites',
      'profile': 'Profile',
      'expiring_soon': 'Expiring Soon',
      'view_all': 'View All',
      'no_campaigns': 'No campaigns found',
      'no_favorites': 'You have no favorite campaigns yet',
      'my_favorites': 'My Favorites',
      'login_required': 'Login required',
      'login_required_for_favorites': 'Please sign in to view your favorites',
      'error_occurred': 'An Error Occurred',
      'no_favorites_yet': 'No Favorites Yet',
      'no_favorites_description':
          'Add campaigns you like to favorites to see them here',
      'explore_campaigns': 'Explore Campaigns',
      'error_loading_favorites': 'An error occurred while loading favorites',

      // Campaign Detail
      'campaign_details': 'Campaign Details',
      'source': 'Source',
      'expires_at': 'Expires At',
      'description': 'Description',
      'add_to_favorites': 'Add to Favorites',
      'remove_from_favorites': 'Remove from Favorites',
      'share_campaign': 'Share Campaign',
      'compare': 'Compare',
      'add_to_compare': 'Add to Compare',
      'remove_from_compare': 'Remove from Compare',
      'price_tracking': 'Price Tracking',
      'track_price': 'Track Price',
      'stop_tracking': 'Stop Tracking',

      // Profile
      'my_profile': 'My Profile',
      'settings': 'Settings',
      'language': 'Language',
      'notifications': 'Notifications',
      'privacy': 'Privacy',
      'terms': 'Terms of Use',
      'about': 'About',
      'logout': 'Logout',
      'login': 'Login',
      'sign_in': 'Sign In',
      'sign_out': 'Sign Out',
      'stats': 'Statistics',
      'favorites_count': 'Favorites',
      'comments_count': 'Comments',
      'ratings_count': 'Ratings',
      'points': 'Points',
      'level': 'Level',
      'badges': 'Badges',
      'community': 'Community',
      'price_tracking_menu': 'Price Tracking',
      'blog': 'Blog & Guides',

      // Gamification
      'your_points': 'Your Points',
      'your_level': 'Your Level',
      'points_to_next_level': 'Points to Next Level',
      'earned_badges': 'Earned Badges',
      'no_badges': 'You haven\'t earned any badges yet',

      // Community
      'leaderboard': 'Leaderboard',
      'community_stats': 'Community Statistics',
      'total_users': 'Total Users',
      'total_favorites': 'Total Favorites',
      'total_comments': 'Total Comments',
      'total_ratings': 'Total Ratings',
      'total_badges': 'Total Badges',
      'total_points': 'Total Points',
      'max_level': 'Max Level',
      'rank': 'Rank',
      'you': 'You',

      // Calendar
      'calendar': 'Calendar',
      'campaign_calendar': 'Campaign Calendar',
      'select_date': 'Select Date',
      'no_campaigns_on_date': 'No campaigns on this date',
      'campaigns_on_date': '{count} campaigns',

      // Comparison
      'compare_campaigns': 'Compare Campaigns',
      'select_campaigns': 'Select Campaigns',
      'min_compare': 'You must select at least 2 campaigns',
      'max_compare': 'You can compare up to 3 campaigns',
      'add_more': 'Add More',
      'remove': 'Remove',
      'clear_all': 'Clear All',

      // Price Tracking
      'tracked_campaigns': 'Tracked Campaigns',
      'price_history': 'Price History',
      'current_price': 'Current Price',
      'original_price': 'Original Price',
      'discount': 'Discount',
      'price_change': 'Price Change',
      'price_increased': 'Price Increased',
      'price_decreased': 'Price Decreased',
      'price_stable': 'Price Stable',
      'no_tracked_campaigns': 'No tracked campaigns',

      // Blog
      'blog_title': 'Blog & Guides',
      'featured_posts': 'Featured',
      'all_posts': 'All Posts',
      'read_more': 'Read More',
      'views': 'Views',
      'author': 'Author',
      'category': 'Category',
      'all_categories': 'All',

      // Comments
      'comments': 'Comments',
      'add_comment': 'Add Comment',
      'write_comment': 'Write your comment...',
      'no_comments': 'No comments yet',
      'comment_added': 'Comment added',
      'comment_deleted': 'Comment deleted',

      // Rating
      'rating': 'Rating',
      'rate_campaign': 'Rate Campaign',
      'your_rating': 'Your Rating',
      'average_rating': 'Average Rating',
      'no_ratings': 'No ratings yet',

      // Notifications
      'notifications': 'Notifications',
      'enable_notifications': 'Enable Notifications',
      'campaign_notifications': 'Campaign Notifications',
      'price_drop_notifications': 'Price Drop Notifications',
      'new_campaign_notifications': 'New Campaign Notifications',

      // Settings
      'settings': 'Settings',
      'app_settings': 'App Settings',
      'account_settings': 'Account Settings',
      'privacy_settings': 'Privacy Settings',
      'notification_settings': 'Notification Settings',
      'language_settings': 'Language Settings',
      'select_language': 'Select Language',

      // Error Messages
      'error_loading': 'Error loading',
      'error_saving': 'Error saving',
      'error_deleting': 'Error deleting',
      'error_network': 'Network error',
      'error_unauthorized': 'Unauthorized access',
      'error_not_found': 'Not found',
      'error_server': 'Server error',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ??
        _localizedValues['tr']?[key] ??
        key;
  }

  // Helper getters for common translations
  String get appName => translate('app_name');
  String get loading => translate('loading');
  String get error => translate('error');
  String get success => translate('success');
  String get cancel => translate('cancel');
  String get save => translate('save');
  String get delete => translate('delete');
  String get edit => translate('edit');
  String get share => translate('share');
  String get refresh => translate('refresh');
  String get search => translate('search');
  String get filter => translate('filter');
  String get close => translate('close');
  String get back => translate('back');
  String get next => translate('next');
  String get done => translate('done');
  String get yes => translate('yes');
  String get no => translate('no');
  String get ok => translate('ok');
  String get retry => translate('retry');
  String get noData => translate('no_data');
  String get noInternet => translate('no_internet');
  String get somethingWentWrong => translate('something_went_wrong');

  // Home Screen
  String get home => translate('home');
  String get campaigns => translate('campaigns');
  String get favorites => translate('favorites');
  String get profile => translate('profile');
  String get expiringSoon => translate('expiring_soon');
  String get viewAll => translate('view_all');
  String get noCampaigns => translate('no_campaigns');
  String get noFavorites => translate('no_favorites');
  String get myFavorites => translate('my_favorites');
  String get loginRequired => translate('login_required');
  String get loginRequiredForFavorites =>
      translate('login_required_for_favorites');
  String get errorOccurred => translate('error_occurred');
  String get noFavoritesYet => translate('no_favorites_yet');
  String get noFavoritesDescription => translate('no_favorites_description');
  String get exploreCampaigns => translate('explore_campaigns');
  String get errorLoadingFavorites => translate('error_loading_favorites');

  // Campaign Detail
  String get campaignDetails => translate('campaign_details');
  String get source => translate('source');
  String get expiresAt => translate('expires_at');
  String get description => translate('description');
  String get addToFavorites => translate('add_to_favorites');
  String get removeFromFavorites => translate('remove_from_favorites');
  String get shareCampaign => translate('share_campaign');
  String get compare => translate('compare');
  String get addToCompare => translate('add_to_compare');
  String get removeFromCompare => translate('remove_from_compare');
  String get priceTracking => translate('price_tracking');
  String get trackPrice => translate('track_price');
  String get stopTracking => translate('stop_tracking');

  // Profile
  String get myProfile => translate('my_profile');
  String get settings => translate('settings');
  String get language => translate('language');
  String get notifications => translate('notifications');
  String get privacy => translate('privacy');
  String get terms => translate('terms');
  String get about => translate('about');
  String get logout => translate('logout');
  String get login => translate('login');
  String get signIn => translate('sign_in');
  String get signOut => translate('sign_out');
  String get stats => translate('stats');
  String get favoritesCount => translate('favorites_count');
  String get commentsCount => translate('comments_count');
  String get ratingsCount => translate('ratings_count');
  String get points => translate('points');
  String get level => translate('level');
  String get badges => translate('badges');
  String get community => translate('community');
  String get priceTrackingMenu => translate('price_tracking_menu');
  String get blog => translate('blog');

  // Gamification
  String get yourPoints => translate('your_points');
  String get yourLevel => translate('your_level');
  String get pointsToNextLevel => translate('points_to_next_level');
  String get earnedBadges => translate('earned_badges');
  String get noBadges => translate('no_badges');

  // Community
  String get leaderboard => translate('leaderboard');
  String get communityStats => translate('community_stats');
  String get totalUsers => translate('total_users');
  String get totalFavorites => translate('total_favorites');
  String get totalComments => translate('total_comments');
  String get totalRatings => translate('total_ratings');
  String get totalBadges => translate('total_badges');
  String get totalPoints => translate('total_points');
  String get maxLevel => translate('max_level');
  String get rank => translate('rank');
  String get you => translate('you');

  // Calendar
  String get calendar => translate('calendar');
  String get campaignCalendar => translate('campaign_calendar');
  String get selectDate => translate('select_date');
  String noCampaignsOnDate(String date) => translate('no_campaigns_on_date');
  String campaignsOnDate(int count) =>
      translate('campaigns_on_date').replaceAll('{count}', count.toString());

  // Comparison
  String get compareCampaigns => translate('compare_campaigns');
  String get selectCampaigns => translate('select_campaigns');
  String get minCompare => translate('min_compare');
  String get maxCompare => translate('max_compare');
  String get addMore => translate('add_more');
  String get remove => translate('remove');
  String get clearAll => translate('clear_all');

  // Price Tracking
  String get trackedCampaigns => translate('tracked_campaigns');
  String get priceHistory => translate('price_history');
  String get currentPrice => translate('current_price');
  String get originalPrice => translate('original_price');
  String get discount => translate('discount');
  String get priceChange => translate('price_change');
  String get priceIncreased => translate('price_increased');
  String get priceDecreased => translate('price_decreased');
  String get priceStable => translate('price_stable');
  String get noTrackedCampaigns => translate('no_tracked_campaigns');

  // Blog
  String get blogTitle => translate('blog_title');
  String get featuredPosts => translate('featured_posts');
  String get allPosts => translate('all_posts');
  String get readMore => translate('read_more');
  String get views => translate('views');
  String get author => translate('author');
  String get category => translate('category');
  String get allCategories => translate('all_categories');

  // Comments
  String get comments => translate('comments');
  String get addComment => translate('add_comment');
  String get writeComment => translate('write_comment');
  String get noComments => translate('no_comments');
  String get commentAdded => translate('comment_added');
  String get commentDeleted => translate('comment_deleted');

  // Rating
  String get rating => translate('rating');
  String get rateCampaign => translate('rate_campaign');
  String get yourRating => translate('your_rating');
  String get averageRating => translate('average_rating');
  String get noRatings => translate('no_ratings');

  // Notifications
  String get enableNotifications => translate('enable_notifications');
  String get campaignNotifications => translate('campaign_notifications');
  String get priceDropNotifications => translate('price_drop_notifications');
  String get newCampaignNotifications =>
      translate('new_campaign_notifications');

  // Settings
  String get appSettings => translate('app_settings');
  String get accountSettings => translate('account_settings');
  String get privacySettings => translate('privacy_settings');
  String get notificationSettings => translate('notification_settings');
  String get languageSettings => translate('language_settings');
  String get selectLanguage => translate('select_language');

  // Error Messages
  String get errorLoading => translate('error_loading');
  String get errorSaving => translate('error_saving');
  String get errorDeleting => translate('error_deleting');
  String get errorNetwork => translate('error_network');
  String get errorUnauthorized => translate('error_unauthorized');
  String get errorNotFound => translate('error_not_found');
  String get errorServer => translate('error_server');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['tr', 'en'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
