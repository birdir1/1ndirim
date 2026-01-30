# Referral System - Implementation Summary

**Tarih**: 30 Ocak 2026  
**Durum**: 🔄 Backend ✅ | Flutter ⏳ | UI ⏳  
**Süre**: 3 gün (1 gün tamamlandı)

---

## 📋 TAMAMLANAN İŞLER (Backend)

### 1. Database Schema ✅

**Tablolar:**
- `referral_codes` - Her kullanıcının unique referral kodu
- `user_referrals` - Referral ilişkileri (kim kimi davet etti)
- `referral_rewards` - Ödül sistemi (gelecek için hazır)

**Özellikler:**
- UUID primary keys
- Unique constraints (bir kullanıcı sadece bir kez davet edilebilir)
- Check constraints (self-referral engelleme)
- Indexes for performance (8 index)
- Auto-update timestamps

**PostgreSQL Functions:**
- `generate_referral_code()` - Unique 8 karakter kod üretir
- `get_or_create_referral_code()` - Kullanıcının kodunu getir/oluştur

### 2. API Endpoints ✅

#### GET /api/referrals/code
Kullanıcının referral kodunu getirir veya oluşturur.

**Auth:** Required (Firebase)  
**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC12345"
  }
}
```

**Features:**
- Otomatik kod oluşturma
- Unique kod garantisi
- 8 karakter (uppercase + numbers)

#### POST /api/referrals/process
Referral kodunu uygular ve ödülleri verir.

**Auth:** Required (Firebase)  
**Body:**
```json
{
  "referralCode": "ABC12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralId": "uuid",
    "referrerId": "firebase_uid",
    "message": "Referral kodu başarıyla uygulandı",
    "rewards": {
      "referrer": { "type": "points", "value": 100 },
      "referee": { "type": "points", "value": 50 }
    }
  }
}
```

**Validations:**
- ✅ Kod geçerli mi?
- ✅ Self-referral engelleme
- ✅ Duplicate referral engelleme
- ✅ Transaction safety (ROLLBACK on error)

**Rewards:**
- Referrer (davet eden): +100 puan
- Referee (davet edilen): +50 puan

#### GET /api/referrals/stats
Kullanıcının referral istatistiklerini getirir.

**Auth:** Required (Firebase)  
**Response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 10,
    "completedReferrals": 8,
    "pendingReferrals": 2,
    "totalRewards": 800
  }
}
```

#### GET /api/referrals/validate/:code
Referral kodunun geçerli olup olmadığını kontrol eder.

**Auth:** Optional  
**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "ABC12345"
  }
}
```

### 3. ReferralService ✅

**Methods:**
- `getOrCreateReferralCode(userId)` - Kod getir/oluştur
- `processReferral(userId, code)` - Referral işle
- `getReferralStats(userId)` - İstatistikler
- `validateReferralCode(code)` - Kod validasyonu
- `getReferralHistory(userId)` - Geçmiş

**Features:**
- Transaction management
- Error handling
- Validation logic
- Reward calculation

---

## ⏳ YAPILACAKLAR (Flutter + UI)

### Gün 2: Flutter Integration

#### 1. Data Models
```dart
// lib/data/models/referral_code_model.dart
class ReferralCodeModel {
  final String code;
  
  ReferralCodeModel({required this.code});
  
  factory ReferralCodeModel.fromMap(Map<String, dynamic> map) {
    return ReferralCodeModel(code: map['referralCode']);
  }
}

// lib/data/models/referral_stats_model.dart
class ReferralStatsModel {
  final int totalReferrals;
  final int completedReferrals;
  final int pendingReferrals;
  final int totalRewards;
  
  // ... constructor, fromMap
}
```

#### 2. API Datasource
```dart
// lib/data/datasources/referral_api_datasource.dart
class ReferralApiDataSource {
  Future<String> getReferralCode();
  Future<void> applyReferralCode(String code);
  Future<ReferralStatsModel> getStats();
  Future<bool> validateCode(String code);
}
```

#### 3. Repository
```dart
// lib/data/repositories/referral_repository.dart
class ReferralRepository {
  final ReferralApiDataSource _datasource;
  
  Future<String> getReferralCode();
  Future<void> applyCode(String code);
  Future<ReferralStatsModel> getStats();
}
```

#### 4. Provider
```dart
// lib/core/providers/referral_provider.dart
class ReferralProvider extends ChangeNotifier {
  String? _referralCode;
  ReferralStatsModel? _stats;
  
  Future<void> loadReferralCode();
  Future<void> applyCode(String code);
  Future<void> loadStats();
}
```

### Gün 3: UI Implementation

#### 1. Referral Screen
```dart
// lib/features/referral/referral_screen.dart
- Referral code display (büyük, kopyalanabilir)
- Share buttons (WhatsApp, SMS, Other)
- Stats card (total, completed, rewards)
- How it works section
```

#### 2. Onboarding Integration
```dart
// lib/features/onboarding/referral_input_page.dart
- "Referral kodun var mı?" adımı
- Kod girişi
- Skip option
- Validation feedback
```

#### 3. Profile Integration
```dart
// lib/features/profile/widgets/referral_section.dart
- "Arkadaşını Davet Et" button
- Quick stats display
- Navigate to referral screen
```

#### 4. Share Functionality
```dart
// lib/core/utils/share_helper.dart
- WhatsApp share
- SMS share
- Generic share
- Deep link generation
```

---

## 🎁 REWARD SYSTEM

### Current Implementation (Basit)
```
Referrer (Davet Eden):
- +100 puan (pending status)

Referee (Davet Edilen):
- +50 puan (pending status)

Status: Sadece tracking, henüz kullanılmıyor
```

### Future Enhancements
```
1. Puan Sistemi
   - Puanları kullanılabilir hale getir
   - Puan harcama mekanizması
   - Puan geçmişi

2. Badge Sistemi
   - 5 davet: "Arkadaş Canlısı" 🎖️
   - 10 davet: "Sosyal Kelebek" 🦋
   - 50 davet: "İndirim Elçisi" 👑

3. Leaderboard
   - En çok davet eden kullanıcılar
   - Haftalık/aylık sıralama
   - Ödüller

4. Premium Features (Gelecekte)
   - X davet = 1 ay premium
   - Özel kampanyalara erişim
```

---

## 🧪 TEST PLANI

### Backend Tests (Tamamlandı)
```bash
# 1. Get referral code
curl http://localhost:3000/api/referrals/code \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Validate code
curl http://localhost:3000/api/referrals/validate/ABC12345

# 3. Apply referral code
curl -X POST http://localhost:3000/api/referrals/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"referralCode": "ABC12345"}'

# 4. Get stats
curl http://localhost:3000/api/referrals/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Flutter Tests (Yapılacak)
```dart
test('should generate unique referral code', () async {
  final code = await repository.getReferralCode();
  expect(code.length, 8);
});

test('should apply referral code successfully', () async {
  await repository.applyCode('TEST1234');
  final stats = await repository.getStats();
  expect(stats.totalReferrals, greaterThan(0));
});

test('should not allow self-referral', () async {
  expect(
    () => repository.applyCode(myOwnCode),
    throwsException,
  );
});
```

---

## 📊 DATABASE STRUCTURE

### Relationships
```
users (Firebase)
  └─> referral_codes (1:1)
        └─> user_referrals (1:N as referrer)
              └─> referral_rewards (1:N)
```

### Sample Data
```sql
-- User A'nın kodu: ABC12345
INSERT INTO referral_codes (user_id, code) 
VALUES ('user_a_firebase_uid', 'ABC12345');

-- User B, User A'nın kodunu kullandı
INSERT INTO user_referrals (referrer_id, referred_id, referral_code, status)
VALUES ('user_a_firebase_uid', 'user_b_firebase_uid', 'ABC12345', 'completed');

-- Ödüller oluşturuldu
INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value)
VALUES 
  ('user_a_firebase_uid', 'referral_id', 'points', 100),
  ('user_b_firebase_uid', 'referral_id', 'points', 50);
```

---

## 🚀 DEPLOYMENT

### Production Checklist
- [x] Database tables created
- [x] Indexes added
- [x] API routes implemented
- [x] Service layer created
- [x] Error handling added
- [x] Transaction safety
- [ ] Flutter integration
- [ ] UI implementation
- [ ] Testing
- [ ] Documentation

### Environment Variables
```env
# Database (already configured)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=indirim_db
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## 📝 SONRAKI ADIMLAR

### Yarın (Gün 2)
1. Flutter models oluştur
2. API datasource implement et
3. Repository pattern uygula
4. Provider setup

### Yarın (Gün 3)
1. Referral screen UI
2. Onboarding integration
3. Profile integration
4. Share functionality
5. Testing

---

## 🎯 BAŞARI KRİTERLERİ

### Teknik
- ✅ Unique code generation
- ✅ Self-referral prevention
- ✅ Duplicate prevention
- ✅ Transaction safety
- ⏳ Flutter integration
- ⏳ UI implementation

### Business
- ⏳ Viral coefficient > 0.5
- ⏳ Referral conversion > %10
- ⏳ Share rate > %20

### UX
- ⏳ Kod kopyalama kolay
- ⏳ Paylaşma seçenekleri var
- ⏳ Stats görünüyor
- ⏳ Onboarding'de kod girişi

---

**Son Güncelleme**: 30 Ocak 2026  
**Güncelleyen**: Kiro AI Assistant  
**Durum**: Backend ✅ Production Ready | Flutter ⏳ Yarın
