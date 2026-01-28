import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../core/utils/page_transitions.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../../core/providers/selected_sources_provider.dart';
import 'package:provider/provider.dart';
import '../home/campaign_detail_screen.dart';

/// Harita Ekranı - Kampanyaları haritada gösterir
class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;
  final OpportunityRepository _repository = OpportunityRepository();
  
  Position? _currentPosition;
  NetworkResult<List<OpportunityModel>>? _campaignsResult;
  List<OpportunityModel> _campaigns = [];
  Set<Marker> _markers = {};
  bool _isLoadingLocation = false;
  bool _isLoadingCampaigns = false;

  // Türkiye merkez koordinatları (varsayılan)
  static const CameraPosition _initialCameraPosition = CameraPosition(
    target: LatLng(39.9334, 32.8597), // Ankara
    zoom: 6.0,
  );

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _loadCampaigns();
  }

  /// Kullanıcının konumunu al
  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      // İzin kontrolü
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Konum servisleri kapalı. Lütfen açın.'),
            ),
          );
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Konum izni reddedildi.'),
              ),
            );
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Konum izni kalıcı olarak reddedilmiş. Ayarlardan açın.'),
            ),
          );
        }
        return;
      }

      // Konumu al
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      if (mounted) {
        setState(() {
          _currentPosition = position;
          _isLoadingLocation = false;
        });

        // Haritayı kullanıcı konumuna kaydır
        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(
            LatLng(position.latitude, position.longitude),
            12.0,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingLocation = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Konum alınamadı: ${e.toString()}'),
          ),
        );
      }
    }
  }

  /// Kampanyaları yükle
  Future<void> _loadCampaigns() async {
    if (_isLoadingCampaigns) return;

    setState(() {
      _isLoadingCampaigns = true;
    });

    final sourcesProvider = Provider.of<SelectedSourcesProvider>(context, listen: false);
    final selectedSourceNames = sourcesProvider.getSelectedSourceNames();

    try {
      final result = await _repository.getOpportunitiesBySources(
        selectedSourceNames.isNotEmpty ? selectedSourceNames : null,
      );

      if (mounted) {
        setState(() {
          _campaignsResult = result;
          _isLoadingCampaigns = false;

          if (result is NetworkSuccess<List<OpportunityModel>>) {
            _campaigns = result.data;
            _buildMarkers();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _campaignsResult = NetworkError.general('Kampanyalar yüklenirken bir hata oluştu');
          _isLoadingCampaigns = false;
        });
      }
    }
  }

  /// Harita marker'larını oluştur
  void _buildMarkers() {
    final markers = <Marker>{};

    // Konum bilgisi olan kampanyalar için marker oluştur
    for (final campaign in _campaigns) {
      if (campaign.sourceLatitude != null && campaign.sourceLongitude != null) {
        final markerId = MarkerId(campaign.id);
        final position = LatLng(
          campaign.sourceLatitude!,
          campaign.sourceLongitude!,
        );

        markers.add(
          Marker(
            markerId: markerId,
            position: position,
            infoWindow: InfoWindow(
              title: campaign.title,
              snippet: campaign.sourceName,
              onTap: () {
                _showCampaignBottomSheet(campaign);
              },
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              BitmapDescriptor.hueRed,
            ),
            onTap: () {
              _showCampaignBottomSheet(campaign);
            },
          ),
        );
      }
    }

    // Kullanıcı konumu için marker
    if (_currentPosition != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('user_location'),
          position: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueBlue,
          ),
          infoWindow: const InfoWindow(
            title: 'Konumunuz',
          ),
        ),
      );
    }

    setState(() {
      _markers = markers;
    });
  }

  /// Kampanya detay bottom sheet göster
  void _showCampaignBottomSheet(OpportunityModel campaign) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: AppColors.backgroundLight,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textSecondaryLight.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Kampanya bilgileri
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      campaign.title,
                      style: AppTextStyles.heading(isDark: false),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          size: 16,
                          color: AppColors.textSecondaryLight,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          campaign.sourceCity ?? campaign.sourceName,
                          style: AppTextStyles.body(isDark: false).copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      campaign.subtitle,
                      style: AppTextStyles.body(isDark: false),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          Navigator.of(context).push(
                            SlidePageRoute(
                              child: CampaignDetailScreen(campaign: campaign),
                              direction: SlideDirection.left,
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryLight,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Detayları Gör',
                          style: AppTextStyles.body(isDark: false).copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Harita',
          style: AppTextStyles.heading(isDark: false),
        ),
        centerTitle: false,
        actions: [
          if (_isLoadingLocation)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primaryLight,
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.my_location, color: AppColors.textPrimaryLight),
              onPressed: _getCurrentLocation,
              tooltip: 'Konumuma git',
            ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimaryLight),
            onPressed: _loadCampaigns,
            tooltip: 'Yenile',
          ),
        ],
      ),
      body: Stack(
        children: [
          // Google Maps
          GoogleMap(
            initialCameraPosition: _initialCameraPosition,
            markers: _markers,
            myLocationButtonEnabled: false,
            myLocationEnabled: true,
            zoomControlsEnabled: false,
            mapType: MapType.normal,
            onMapCreated: (GoogleMapController controller) {
              _mapController = controller;
            },
          ),
          // Yükleniyor göstergesi
          if (_isLoadingCampaigns)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: CircularProgressIndicator(
                  color: AppColors.primaryLight,
                ),
              ),
            ),
          // Hata mesajı
          if (_campaignsResult is NetworkError)
            Positioned(
              top: 20,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        (_campaignsResult as NetworkError).message,
                        style: AppTextStyles.body(isDark: false).copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          // Kampanya sayısı bilgisi
          if (_campaigns.isNotEmpty)
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_offer, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${_campaigns.length} kampanya gösteriliyor',
                        style: AppTextStyles.body(isDark: false).copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
