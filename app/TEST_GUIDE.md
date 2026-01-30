# Test Guide

Bu dokümanda 1ndirim uygulamasının test altyapısı ve test çalıştırma komutları açıklanmaktadır.

## Test Yapısı

```
test/
├── unit/                          # Unit tests
│   ├── error_handler_test.dart    # Error handler tests
│   ├── api_config_test.dart       # API config tests
│   ├── models/                    # Model tests
│   │   └── opportunity_model_test.dart
│   └── repositories/              # Repository tests
│       └── opportunity_repository_test.dart
├── widget/                        # Widget tests
│   └── campaign_card_test.dart    # Campaign card widget tests
└── integration_test/              # Integration tests
    └── app_test.dart              # Full app integration tests
```

## Test Türleri

### 1. Unit Tests
Tek bir fonksiyon, sınıf veya metodu test eder. Bağımlılıklar mock'lanır.

**Örnekler:**
- Error handler logic
- API configuration
- Model validation
- Repository logic

### 2. Widget Tests
UI bileşenlerini test eder. Widget'ların doğru render edildiğini ve kullanıcı etkileşimlerine doğru yanıt verdiğini kontrol eder.

**Örnekler:**
- Campaign card rendering
- Button interactions
- Form validation
- Navigation

### 3. Integration Tests
Uygulamanın tamamını veya büyük bir bölümünü test eder. Gerçek cihaz veya emülatörde çalışır.

**Örnekler:**
- Login flow
- Campaign browsing
- Favorite management
- Search functionality

## Test Komutları

### Tüm Testleri Çalıştır

```bash
# Tüm unit ve widget testleri
flutter test

# Verbose output ile
flutter test --verbose

# Coverage raporu ile
flutter test --coverage
```

### Belirli Test Dosyasını Çalıştır

```bash
# Tek bir test dosyası
flutter test test/unit/error_handler_test.dart

# Belirli bir klasördeki tüm testler
flutter test test/unit/

# Widget testleri
flutter test test/widget/
```

### Integration Tests

```bash
# Android emülatör/cihazda
flutter test integration_test/app_test.dart

# iOS simulator/cihazda
flutter test integration_test/app_test.dart -d iPhone

# Belirli cihazda
flutter test integration_test/app_test.dart -d <device-id>
```

### Coverage Raporu

```bash
# Coverage oluştur
flutter test --coverage

# HTML raporu oluştur (lcov gerekli)
genhtml coverage/lcov.info -o coverage/html

# Raporu aç (macOS)
open coverage/html/index.html

# Raporu aç (Linux)
xdg-open coverage/html/index.html
```

## Test Yazma Kuralları

### 1. Test Adlandırma

```dart
// ✅ İyi
test('handleError returns correct message for NetworkException', () {});

// ❌ Kötü
test('test1', () {});
```

### 2. Test Yapısı (AAA Pattern)

```dart
test('description', () {
  // Arrange - Test için gerekli setup
  final error = NetworkException('Test error');
  
  // Act - Test edilecek aksiyonu çalıştır
  final message = ErrorHandler.handleError(error);
  
  // Assert - Sonucu doğrula
  expect(message, 'Test error');
});
```

### 3. Test İzolasyonu

Her test bağımsız olmalı ve diğer testlerden etkilenmemelidir.

```dart
group('ErrorHandler', () {
  setUp(() {
    // Her testten önce çalışır
  });

  tearDown(() {
    // Her testten sonra çalışır
  });

  test('test 1', () {});
  test('test 2', () {});
});
```

### 4. Mock Kullanımı

```dart
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

@GenerateMocks([ApiService])
void main() {
  late MockApiService mockApi;

  setUp(() {
    mockApi = MockApiService();
  });

  test('fetches data successfully', () async {
    // Mock response
    when(mockApi.getData()).thenAnswer((_) async => ['data']);
    
    // Test
    final result = await mockApi.getData();
    
    // Verify
    expect(result, ['data']);
    verify(mockApi.getData()).called(1);
  });
}
```

## Test Coverage Hedefleri

| Kategori | Hedef | Mevcut |
|----------|-------|--------|
| Unit Tests | 80% | 15% |
| Widget Tests | 70% | 5% |
| Integration Tests | 50% | 5% |
| **Toplam** | **70%** | **10%** |

## Öncelikli Test Alanları

### 1. Critical Path (Yüksek Öncelik)
- [x] Error handling
- [x] API configuration
- [x] Campaign model
- [x] Campaign card widget
- [ ] Login flow
- [ ] Campaign list
- [ ] Favorite management
- [ ] Search functionality

### 2. Core Features (Orta Öncelik)
- [ ] Repository layer
- [ ] Data sources
- [ ] State management
- [ ] Navigation
- [ ] Form validation

### 3. Edge Cases (Düşük Öncelik)
- [ ] Network errors
- [ ] Empty states
- [ ] Loading states
- [ ] Error states
- [ ] Offline mode

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter test --coverage
      - uses: codecov/codecov-action@v2
```

## Debugging Tests

### Test Başarısız Olduğunda

```bash
# Verbose output
flutter test --verbose

# Tek test çalıştır
flutter test test/unit/error_handler_test.dart

# Debug mode
flutter test --start-paused
```

### Widget Test Debug

```dart
testWidgets('debug widget', (WidgetTester tester) async {
  await tester.pumpWidget(MyWidget());
  
  // Widget tree'yi yazdır
  debugDumpApp();
  
  // Render tree'yi yazdır
  debugDumpRenderTree();
  
  // Semantics tree'yi yazdır
  debugDumpSemanticsTree();
});
```

## Best Practices

1. **Test İsimleri Açıklayıcı Olmalı**
   - Ne test edildiği açık olmalı
   - Beklenen sonuç belirtilmeli

2. **Her Test Tek Bir Şeyi Test Etmeli**
   - Single Responsibility Principle
   - Hata ayıklamayı kolaylaştırır

3. **Test Verileri Anlamlı Olmalı**
   - Gerçekçi test verileri kullan
   - Edge case'leri test et

4. **Mock'ları Akıllıca Kullan**
   - Sadece external dependencies'i mock'la
   - Over-mocking'den kaçın

5. **Test Bakımı**
   - Testleri düzenli güncelle
   - Kırık testleri hemen düzelt
   - Gereksiz testleri sil

## Kaynaklar

- [Flutter Testing Documentation](https://docs.flutter.dev/testing)
- [Effective Dart: Testing](https://dart.dev/guides/language/effective-dart/testing)
- [Mockito Documentation](https://pub.dev/packages/mockito)
- [Integration Testing](https://docs.flutter.dev/testing/integration-tests)

---

**Son Güncelleme**: 30 Ocak 2026  
**Test Coverage**: %10 → Hedef: %70
