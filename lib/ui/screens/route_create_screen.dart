import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../features/location/infrastructure/google_places_address_service.dart';
import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_spacing.dart';
import '../tokens/form_validation_tokens.dart';

class RouteCreateScreen extends StatefulWidget {
  const RouteCreateScreen({
    super.key,
    this.onCreate,
    this.googleMapsApiKey,
    this.addressAutocompleteGateway,
  });

  final Future<void> Function(RouteCreateFormInput input)? onCreate;
  final String? googleMapsApiKey;
  final AddressAutocompleteGateway? addressAutocompleteGateway;

  @override
  State<RouteCreateScreen> createState() => _RouteCreateScreenState();
}

class _RouteCreateScreenState extends State<RouteCreateScreen> {
  final _nameController = TextEditingController();
  final _startAddressController = TextEditingController();
  final _endAddressController = TextEditingController();
  final _scheduledTimeController = TextEditingController(text: '07:00');

  bool _allowGuestTracking = true;
  bool _submitting = false;
  String? _validationError;
  String _selectedTimeSlot = 'morning';

  _NamedMapPoint? _selectedStartPoint;
  _NamedMapPoint? _selectedEndPoint;
  List<_NamedMapPoint> _startSuggestions = const <_NamedMapPoint>[];
  List<_NamedMapPoint> _endSuggestions = const <_NamedMapPoint>[];
  bool _startSuggestionsLoading = false;
  bool _endSuggestionsLoading = false;
  bool _startSelectionResolving = false;
  bool _endSelectionResolving = false;
  Timer? _startSuggestionDebounce;
  Timer? _endSuggestionDebounce;
  int _startSuggestionRequestVersion = 0;
  int _endSuggestionRequestVersion = 0;
  bool _suppressStartQueryListenerOnce = false;
  bool _suppressEndQueryListenerOnce = false;
  late final AddressAutocompleteGateway? _addressAutocompleteGateway;
  late final bool _ownsAddressAutocompleteGateway;
  String _placesSessionToken = '';

  static const List<String> _quickTimes = <String>[
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
  ];

  static const List<_NamedMapPoint> _routePointPresets = <_NamedMapPoint>[
    _NamedMapPoint(
      title: 'Levent Metro',
      address: 'Levent Metro Istanbul',
      lat: 41.0827,
      lng: 29.0127,
    ),
    _NamedMapPoint(
      title: 'Maslak Plaza',
      address: 'Maslak Plaza Istanbul',
      lat: 41.1090,
      lng: 29.0218,
    ),
    _NamedMapPoint(
      title: 'Besiktas Meydan',
      address: 'Besiktas Meydan Istanbul',
      lat: 41.0438,
      lng: 29.0053,
    ),
    _NamedMapPoint(
      title: 'Kadikoy Rhtm',
      address: 'Kadikoy Rhtm Istanbul',
      lat: 40.9912,
      lng: 29.0253,
    ),
    _NamedMapPoint(
      title: 'Uskudar Sahil',
      address: 'Uskudar Sahil Istanbul',
      lat: 41.0261,
      lng: 29.0169,
    ),
    _NamedMapPoint(
      title: 'Mecidiyekoy Meydan',
      address: 'Mecidiyekoy Meydan Istanbul',
      lat: 41.0665,
      lng: 28.9929,
    ),
  ];

  static const _NamedMapPoint _currentLocationApprox = _NamedMapPoint(
    title: 'Konumum',
    address: 'Konumum (yaklasik)',
    lat: 41.0151,
    lng: 28.9795,
  );

  @override
  void initState() {
    super.initState();
    _placesSessionToken = _newPlacesSessionToken();
    final providedGateway = widget.addressAutocompleteGateway;
    final apiKey = (widget.googleMapsApiKey ?? '').trim();
    if (providedGateway != null) {
      _addressAutocompleteGateway = providedGateway;
      _ownsAddressAutocompleteGateway = false;
    } else if (apiKey.isNotEmpty) {
      _addressAutocompleteGateway = GooglePlacesAddressService(apiKey: apiKey);
      _ownsAddressAutocompleteGateway = true;
    } else {
      _addressAutocompleteGateway = null;
      _ownsAddressAutocompleteGateway = false;
    }
    _startAddressController.addListener(_handleStartQueryChanged);
    _endAddressController.addListener(_handleEndQueryChanged);
  }

  @override
  void dispose() {
    _startAddressController.removeListener(_handleStartQueryChanged);
    _endAddressController.removeListener(_handleEndQueryChanged);
    _startSuggestionDebounce?.cancel();
    _endSuggestionDebounce?.cancel();
    _nameController.dispose();
    _startAddressController.dispose();
    _endAddressController.dispose();
    _scheduledTimeController.dispose();
    if (_ownsAddressAutocompleteGateway) {
      _addressAutocompleteGateway?.dispose();
    }
    super.dispose();
  }

  void _handleStartQueryChanged() {
    if (_suppressStartQueryListenerOnce) {
      _suppressStartQueryListenerOnce = false;
      return;
    }
    final normalizedQuery = _normalizeAddress(_startAddressController.text);
    final selected = _selectedStartPoint;
    if (selected != null &&
        _normalizeAddress(selected.address) != normalizedQuery &&
        mounted) {
      _selectedStartPoint = null;
    }
    _scheduleStartSuggestions();
  }

  void _handleEndQueryChanged() {
    if (_suppressEndQueryListenerOnce) {
      _suppressEndQueryListenerOnce = false;
      return;
    }
    final normalizedQuery = _normalizeAddress(_endAddressController.text);
    final selected = _selectedEndPoint;
    if (selected != null &&
        _normalizeAddress(selected.address) != normalizedQuery &&
        mounted) {
      _selectedEndPoint = null;
    }
    _scheduleEndSuggestions();
  }

  void _scheduleStartSuggestions() {
    _startSuggestionDebounce?.cancel();
    final query = _startAddressController.text;
    if (_addressAutocompleteGateway == null) {
      if (!mounted) {
        return;
      }
      setState(() {
        _startSuggestionsLoading = false;
        _startSuggestions = _buildLocalSuggestions(query);
      });
      return;
    }
    final normalized = _normalizeAddress(query);
    if (normalized.length < 2) {
      if (!mounted) {
        return;
      }
      setState(() {
        _startSuggestionsLoading = false;
        _startSuggestions = const <_NamedMapPoint>[];
      });
      return;
    }
    if (mounted) {
      setState(() {
        _startSuggestionsLoading = true;
      });
    }
    _startSuggestionDebounce = Timer(
      const Duration(milliseconds: 320),
      () => unawaited(_loadStartSuggestions(query)),
    );
  }

  void _scheduleEndSuggestions() {
    _endSuggestionDebounce?.cancel();
    final query = _endAddressController.text;
    if (_addressAutocompleteGateway == null) {
      if (!mounted) {
        return;
      }
      setState(() {
        _endSuggestionsLoading = false;
        _endSuggestions = _buildLocalSuggestions(query);
      });
      return;
    }
    final normalized = _normalizeAddress(query);
    if (normalized.length < 2) {
      if (!mounted) {
        return;
      }
      setState(() {
        _endSuggestionsLoading = false;
        _endSuggestions = const <_NamedMapPoint>[];
      });
      return;
    }
    if (mounted) {
      setState(() {
        _endSuggestionsLoading = true;
      });
    }
    _endSuggestionDebounce = Timer(
      const Duration(milliseconds: 320),
      () => unawaited(_loadEndSuggestions(query)),
    );
  }

  Future<void> _loadStartSuggestions(String query) async {
    final requestVersion = ++_startSuggestionRequestVersion;
    final remote = await _fetchGoogleSuggestions(
      query: query,
      isStart: true,
    );
    if (!mounted || requestVersion != _startSuggestionRequestVersion) {
      return;
    }
    setState(() {
      _startSuggestionsLoading = false;
      _startSuggestions = remote ?? _buildLocalSuggestions(query);
    });
  }

  Future<void> _loadEndSuggestions(String query) async {
    final requestVersion = ++_endSuggestionRequestVersion;
    final remote = await _fetchGoogleSuggestions(
      query: query,
      isStart: false,
    );
    if (!mounted || requestVersion != _endSuggestionRequestVersion) {
      return;
    }
    setState(() {
      _endSuggestionsLoading = false;
      _endSuggestions = remote ?? _buildLocalSuggestions(query);
    });
  }

  Future<List<_NamedMapPoint>?> _fetchGoogleSuggestions({
    required String query,
    required bool isStart,
  }) async {
    final gateway = _addressAutocompleteGateway;
    if (gateway == null) {
      return null;
    }
    try {
      final suggestions = await gateway.suggest(
        query: query,
        sessionToken: _placesSessionToken,
      );
      return suggestions.map((suggestion) {
        final fallbackPoint = _derivePointFromAddress(
          suggestion.address,
          isStart: isStart,
        );
        return _NamedMapPoint(
          title: suggestion.title,
          address: suggestion.address,
          placeId: suggestion.placeId,
          lat: fallbackPoint.lat,
          lng: fallbackPoint.lng,
        );
      }).toList(growable: false);
    } catch (_) {
      return null;
    }
  }

  List<_NamedMapPoint> _buildLocalSuggestions(String queryRaw) {
    final normalizedQuery = _normalizeAddress(queryRaw);
    if (normalizedQuery.length < 2) {
      return const <_NamedMapPoint>[];
    }

    final exactMatch = _routePointPresets.any(
      (point) =>
          _normalizeAddress(point.title) == normalizedQuery ||
          _normalizeAddress(point.address) == normalizedQuery,
    );
    if (exactMatch) {
      return const <_NamedMapPoint>[];
    }

    return _routePointPresets
        .where(
          (point) =>
              _normalizeAddress(point.title).contains(normalizedQuery) ||
              _normalizeAddress(point.address).contains(normalizedQuery),
        )
        .take(5)
        .toList(growable: false);
  }

  Future<void> _submitQuickRoute() async {
    final input = _buildInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onCreate?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  RouteCreateFormInput? _buildInput() {
    final name = _nameController.text.trim();
    final startAddress = _startAddressController.text.trim();
    final endAddress = _endAddressController.text.trim();
    final scheduledTime = _scheduledTimeController.text.trim();

    if (name.length < 2) {
      _setValidation(CoreFormValidationTokens.routeNameMin2);
      return null;
    }
    if (startAddress.length < 3 || endAddress.length < 3) {
      _setValidation(CoreFormValidationTokens.startEndAddressMin3);
      return null;
    }
    if (!_isValidTime(scheduledTime)) {
      _setValidation(CoreFormValidationTokens.timeFormat);
      return null;
    }

    final startPoint = _resolveInputPoint(
      address: startAddress,
      selected: _selectedStartPoint,
      isStart: true,
    );
    final endPoint = _resolveInputPoint(
      address: endAddress,
      selected: _selectedEndPoint,
      isStart: false,
    );

    return RouteCreateFormInput(
      name: name,
      startAddress: startAddress,
      endAddress: endAddress,
      startLat: startPoint.lat,
      startLng: startPoint.lng,
      endLat: endPoint.lat,
      endLng: endPoint.lng,
      scheduledTime: scheduledTime,
      timeSlot: _selectedTimeSlot,
      allowGuestTracking: _allowGuestTracking,
    );
  }

  Future<void> _applyStartSuggestion(_NamedMapPoint suggestion) async {
    _startSuggestionDebounce?.cancel();
    _startSuggestionRequestVersion++;
    _suppressStartQueryListenerOnce = true;
    _startAddressController.value = TextEditingValue(
      text: suggestion.address,
      selection: TextSelection.collapsed(offset: suggestion.address.length),
    );
    if (!mounted) {
      return;
    }
    setState(() {
      _startSelectionResolving = true;
      _startSuggestions = const <_NamedMapPoint>[];
      _startSuggestionsLoading = false;
      _validationError = null;
    });
    final resolved = await _resolveSuggestionPoint(
      suggestion,
    );
    if (!mounted) {
      return;
    }
    _suppressStartQueryListenerOnce = true;
    _startAddressController.value = TextEditingValue(
      text: resolved.address,
      selection: TextSelection.collapsed(offset: resolved.address.length),
    );
    setState(() {
      _selectedStartPoint = resolved;
      _startSelectionResolving = false;
      _startSuggestions = const <_NamedMapPoint>[];
      _startSuggestionsLoading = false;
      _validationError = null;
      _prefillRouteNameIfPossible();
    });
    FocusScope.of(context).unfocus();
  }

  Future<void> _applyEndSuggestion(_NamedMapPoint suggestion) async {
    _endSuggestionDebounce?.cancel();
    _endSuggestionRequestVersion++;
    _suppressEndQueryListenerOnce = true;
    _endAddressController.value = TextEditingValue(
      text: suggestion.address,
      selection: TextSelection.collapsed(offset: suggestion.address.length),
    );
    if (!mounted) {
      return;
    }
    setState(() {
      _endSelectionResolving = true;
      _endSuggestions = const <_NamedMapPoint>[];
      _endSuggestionsLoading = false;
      _validationError = null;
    });
    final resolved = await _resolveSuggestionPoint(
      suggestion,
    );
    if (!mounted) {
      return;
    }
    _suppressEndQueryListenerOnce = true;
    _endAddressController.value = TextEditingValue(
      text: resolved.address,
      selection: TextSelection.collapsed(offset: resolved.address.length),
    );
    setState(() {
      _selectedEndPoint = resolved;
      _endSelectionResolving = false;
      _endSuggestions = const <_NamedMapPoint>[];
      _endSuggestionsLoading = false;
      _validationError = null;
      _prefillRouteNameIfPossible();
    });
    FocusScope.of(context).unfocus();
  }

  void _setStartToCurrentLocation() {
    _startSuggestionDebounce?.cancel();
    _startSuggestionRequestVersion++;
    _suppressStartQueryListenerOnce = true;
    _startAddressController.value = TextEditingValue(
      text: _currentLocationApprox.address,
      selection: TextSelection.collapsed(
        offset: _currentLocationApprox.address.length,
      ),
    );
    setState(() {
      _selectedStartPoint = _currentLocationApprox;
      _startSuggestions = const <_NamedMapPoint>[];
      _validationError = null;
      _prefillRouteNameIfPossible();
    });
  }

  Future<_NamedMapPoint> _resolveSuggestionPoint(
      _NamedMapPoint suggestion) async {
    final placeId = suggestion.placeId?.trim();
    final gateway = _addressAutocompleteGateway;
    if (gateway == null || placeId == null || placeId.isEmpty) {
      return suggestion;
    }
    try {
      final details = await gateway.getPlaceDetails(
        placeId: placeId,
        sessionToken: _placesSessionToken,
      );
      if (details == null) {
        return suggestion;
      }
      return _NamedMapPoint(
        title: details.title,
        address: details.address,
        lat: details.lat,
        lng: details.lng,
        placeId: details.placeId,
      );
    } catch (_) {
      // Keep the fallback point so the driver can continue even if Places fails.
      return _NamedMapPoint(
        title: suggestion.title,
        address: suggestion.address,
        lat: suggestion.lat,
        lng: suggestion.lng,
        placeId: suggestion.placeId,
      );
    } finally {
      // Rotate the session after a successful selection attempt to keep sessions short.
      _placesSessionToken = _newPlacesSessionToken();
    }
  }

  Future<void> _pickCustomTime() async {
    final initial = _parseTime(_scheduledTimeController.text) ??
        const TimeOfDay(hour: 7, minute: 0);
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      helpText: 'Planlanan saat',
    );
    if (picked == null || !mounted) {
      return;
    }
    final label = _toim(picked);
    setState(() {
      _scheduledTimeController.text = label;
      _selectedTimeSlot = _resolveTimeSlotFromTime(label);
      _validationError = null;
    });
  }

  void _setTimeFromChip(String value) {
    setState(() {
      _scheduledTimeController.text = value;
      _selectedTimeSlot = _resolveTimeSlotFromTime(value);
      _validationError = null;
    });
  }

  TimeOfDay? _parseTime(String value) {
    final parts = value.split(':');
    if (parts.length != 2) {
      return null;
    }
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) {
      return null;
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return TimeOfDay(hour: hour, minute: minute);
  }

  String _toim(TimeOfDay value) {
    final h = value.hour.toString().padLeft(2, '0');
    final m = value.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  _NamedMapPoint _resolveInputPoint({
    required String address,
    required _NamedMapPoint? selected,
    required bool isStart,
  }) {
    if (selected != null &&
        _normalizeAddress(selected.address) == _normalizeAddress(address)) {
      return selected;
    }

    final presetMatch = _matchPresetByAddress(address);
    if (presetMatch != null) {
      return presetMatch;
    }

    return _derivePointFromAddress(address, isStart: isStart);
  }

  _NamedMapPoint? _matchPresetByAddress(String rawAddress) {
    final normalized = _normalizeAddress(rawAddress);
    if (normalized.isEmpty) {
      return null;
    }
    for (final preset in _routePointPresets) {
      if (normalized.contains(_normalizeAddress(preset.title)) ||
          normalized.contains(_normalizeAddress(preset.address))) {
        return preset;
      }
    }
    return null;
  }

  String _normalizeAddress(String value) {
    return value.toLowerCase().replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  _NamedMapPoint _derivePointFromAddress(
    String address, {
    required bool isStart,
  }) {
    final normalized = _normalizeAddress(address);
    var hash = 0;
    for (final unit in normalized.codeUnits) {
      hash = ((hash * 31) + unit) & 0x7fffffff;
    }

    final latOffset = ((hash % 2000) / 2000.0) * 0.12;
    final lngOffset = (((hash ~/ 2000) % 2000) / 2000.0) * 0.18;
    final latBase = isStart ? 40.97 : 41.01;
    final lngBase = isStart ? 28.95 : 29.02;
    final lat = _clamp(latBase + latOffset, -90, 90);
    final lng = _clamp(lngBase + lngOffset, -180, 180);

    return _NamedMapPoint(
      title: isStart ? 'Başlangıç Noktası' : 'Bitiş Noktası',
      address: address,
      lat: lat,
      lng: lng,
    );
  }

  double _clamp(double value, double min, double max) {
    return math.max(min, math.min(max, value));
  }

  String _newPlacesSessionToken() {
    final now = DateTime.now().toUtc().microsecondsSinceEpoch;
    final salt = Object.hash(now, hashCode) & 0x7fffffff;
    return 'ns_route_${now}_$salt';
  }

  void _prefillRouteNameIfPossible() {
    if (_nameController.text.trim().isNotEmpty) {
      return;
    }
    final startLabel = _selectedStartPoint?.title.trim();
    final endLabel = _selectedEndPoint?.title.trim();
    if (startLabel == null || startLabel.isEmpty) {
      return;
    }
    if (endLabel == null || endLabel.isEmpty) {
      return;
    }
    _nameController.text = '$startLabel - $endLabel';
  }

  String _resolveTimeSlotFromTime(String value) {
    final parts = value.split(':');
    if (parts.length != 2) {
      return _selectedTimeSlot;
    }
    final hour = int.tryParse(parts.first);
    if (hour == null) {
      return _selectedTimeSlot;
    }
    if (hour < 10) {
      return 'morning';
    }
    if (hour < 16) {
      return 'midday';
    }
    return 'evening';
  }

  String _timeSlotLabel(String slot) {
    switch (slot) {
      case 'morning':
        return 'Sabah';
      case 'midday':
        return 'Oglen';
      case 'evening':
        return 'Aksam';
      default:
        return 'Ozel';
    }
  }

  bool _isValidTime(String value) {
    final matcher = RegExp(r'^([01]\d|2[0-3]):[0-5]\d$');
    return matcher.hasMatch(value);
  }

  void _setValidation(String message) {
    setState(() {
      _validationError = message;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isFormBusy =
        _submitting || _startSelectionResolving || _endSelectionResolving;
    return CoreScreenScaffold(
      title: 'iizli Rota Oluştur',
      subtitle: 'Başlangıç ve bitişi yaz, öneriden sec',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const _FlowTipCard(
            title: 'MVP akis',
            description:
                'Canlı rota yok. Adresleri yaz, alttaki öneriden sec, saati belirle, rotayı ac.',
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _nameController,
            enabled: !_submitting,
            decoration: const InputDecoration(labelText: 'Rota Adi'),
          ),
          const SizedBox(height: CoreSpacing.space12),
          _AddressInputBlock(
            title: 'Başlangıç Adresi',
            controller: _startAddressController,
            suggestions: _startSuggestions,
            selectedPoint: _selectedStartPoint,
            enabled: !isFormBusy,
            isSuggestionsLoading: _startSuggestionsLoading,
            isSelectionResolving: _startSelectionResolving,
            onSuggestionTap: _applyStartSuggestion,
            onUseCurrentTap: _setStartToCurrentLocation,
          ),
          const SizedBox(height: CoreSpacing.space12),
          _AddressInputBlock(
            title: 'Bitiş Adresi',
            controller: _endAddressController,
            suggestions: _endSuggestions,
            selectedPoint: _selectedEndPoint,
            enabled: !isFormBusy,
            isSuggestionsLoading: _endSuggestionsLoading,
            isSelectionResolving: _endSelectionResolving,
            onSuggestionTap: _applyEndSuggestion,
          ),
          const SizedBox(height: CoreSpacing.space12),
          _TimeSelectBlock(
            currentTime: _scheduledTimeController.text,
            times: _quickTimes,
            isBusy: isFormBusy,
            onTimeTap: _setTimeFromChip,
            onCustomTimeTap: _pickCustomTime,
          ),
          const SizedBox(height: CoreSpacing.space12),
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: <Widget>[
                  const Icon(Icons.schedule_rounded, size: 18),
                  const SizedBox(width: CoreSpacing.space8),
                  Expanded(
                    child: Text(
                      'Zaman dilimi (otomatik): ${_timeSlotLabel(_selectedTimeSlot)}',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: CoreSpacing.space8),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _allowGuestTracking,
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _allowGuestTracking = value;
                    });
                  },
            title: const Text('Misafir takip izni'),
            subtitle: const Text('Acil durumda misafir takip açık olabilir.'),
          ),
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            Text(
              _validationError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: CoreSpacing.space20),
          CorePrimaryButton(
            label: _submitting ? 'İşleniyor...' : 'Rotayı Oluştur',
            onPressed: isFormBusy ? null : _submitQuickRoute,
          ),
        ],
      ),
    );
  }
}

class _FlowTipCard extends StatelessWidget {
  const _FlowTipCard({
    required this.title,
    required this.description,
  });

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: CoreSpacing.space4),
            Text(description),
          ],
        ),
      ),
    );
  }
}

class _AddressInputBlock extends StatelessWidget {
  const _AddressInputBlock({
    required this.title,
    required this.controller,
    required this.suggestions,
    required this.enabled,
    required this.isSuggestionsLoading,
    required this.isSelectionResolving,
    required this.onSuggestionTap,
    this.selectedPoint,
    this.onUseCurrentTap,
  });

  final String title;
  final TextEditingController controller;
  final List<_NamedMapPoint> suggestions;
  final bool enabled;
  final bool isSuggestionsLoading;
  final bool isSelectionResolving;
  final Future<void> Function(_NamedMapPoint suggestion) onSuggestionTap;
  final _NamedMapPoint? selectedPoint;
  final VoidCallback? onUseCurrentTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextField(
              controller: controller,
              enabled: enabled,
              decoration: InputDecoration(
                labelText: title,
                hintText: 'Adres yazmaya basla...',
                suffixIcon: (isSuggestionsLoading || isSelectionResolving)
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : null,
              ),
            ),
            if (isSuggestionsLoading || isSelectionResolving) ...<Widget>[
              const SizedBox(height: CoreSpacing.space4),
              Text(
                isSelectionResolving
                    ? 'Adres noktası çözülüyor...'
                    : 'Öneriler yükleniyor...',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (onUseCurrentTap != null) ...<Widget>[
              const SizedBox(height: CoreSpacing.space8),
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: enabled ? onUseCurrentTap : null,
                  icon: const Icon(Icons.my_location_rounded, size: 18),
                  label: const Text('Konumumdan Al'),
                ),
              ),
            ],
            if (suggestions.isNotEmpty) ...<Widget>[
              const SizedBox(height: CoreSpacing.space8),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                ),
                child: Column(
                  children: <Widget>[
                    for (var i = 0; i < suggestions.length; i++) ...<Widget>[
                      ListTile(
                        dense: true,
                        leading: const Icon(Icons.place_outlined, size: 18),
                        title: Text(suggestions[i].title),
                        subtitle: Text(suggestions[i].address),
                        onTap: enabled
                            ? () => unawaited(onSuggestionTap(suggestions[i]))
                            : null,
                      ),
                      if (i < suggestions.length - 1) const Divider(height: 1),
                    ],
                  ],
                ),
              ),
            ],
            if (selectedPoint != null) ...<Widget>[
              const SizedBox(height: CoreSpacing.space8),
              Text(
                'Secili: ${selectedPoint!.title}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TimeSelectBlock extends StatelessWidget {
  const _TimeSelectBlock({
    required this.currentTime,
    required this.times,
    required this.isBusy,
    required this.onTimeTap,
    required this.onCustomTimeTap,
  });

  final String currentTime;
  final List<String> times;
  final bool isBusy;
  final ValueChanged<String> onTimeTap;
  final VoidCallback onCustomTimeTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text('Planlanan Saat'),
            const SizedBox(height: CoreSpacing.space8),
            Wrap(
              spacing: CoreSpacing.space8,
              runSpacing: CoreSpacing.space8,
              children: times
                  .map(
                    (time) => ChoiceChip(
                      label: Text(time),
                      selected: currentTime == time,
                      onSelected: isBusy ? null : (_) => onTimeTap(time),
                    ),
                  )
                  .toList(growable: false),
            ),
            const SizedBox(height: CoreSpacing.space10),
            Row(
              children: <Widget>[
                Expanded(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                      child: Text(
                        'Secilen: $currentTime',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: CoreSpacing.space8),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(112, 48),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                  ),
                  onPressed: isBusy ? null : onCustomTimeTap,
                  child: const Text('Ozel Saat'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _NamedMapPoint {
  const _NamedMapPoint({
    required this.title,
    required this.address,
    required this.lat,
    required this.lng,
    this.placeId,
  });

  final String title;
  final String address;
  final double lat;
  final double lng;
  final String? placeId;
}

class RouteCreateFormInput {
  const RouteCreateFormInput({
    required this.name,
    required this.startAddress,
    required this.endAddress,
    required this.startLat,
    required this.startLng,
    required this.endLat,
    required this.endLng,
    required this.scheduledTime,
    required this.timeSlot,
    required this.allowGuestTracking,
  });

  final String name;
  final String startAddress;
  final String endAddress;
  final double startLat;
  final double startLng;
  final double endLat;
  final double endLng;
  final String scheduledTime;
  final String timeSlot;
  final bool allowGuestTracking;
}
