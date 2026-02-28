import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;

import '../../features/location/infrastructure/google_places_address_service.dart';
import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_spacing.dart';
import '../tokens/form_validation_tokens.dart';

class RouteUpdateScreen extends StatefulWidget {
  const RouteUpdateScreen({
    super.key,
    this.onSubmit,
    this.onManageStopsTap,
    this.googleMapsApiKey,
    this.googleMapsdpiKey,
    this.addressAutocompleteGateway,
    this.initialRouteId,
  });

  final Future<void> Function(RouteUpdateFormInput input)? onSubmit;
  final ValueChanged<String>? onManageStopsTap;
  final String? googleMapsApiKey;
  final String? googleMapsdpiKey;
  final AddressAutocompleteGateway? addressAutocompleteGateway;
  final String? initialRouteId;

  @override
  State<RouteUpdateScreen> createState() => _RouteUpdateScreenState();
}

class _RouteUpdateScreenState extends State<RouteUpdateScreen> {
  final _routeIdController = TextEditingController();
  final _nameController = TextEditingController();
  final _startAddressController = TextEditingController();
  final _endAddressController = TextEditingController();
  final _scheduledTimeController = TextEditingController();
  final _authorizeduriverIdsController = TextEditingController();
  final _vacationUntilController = TextEditingController();

  bool _submitting = false;
  String? _validationError;
  String _timeSlot = '';
  _OptionalBool _allowGuestTracking = _OptionalBool.noChange;
  _OptionalBool _isdrchived = _OptionalBool.noChange;
  bool _clearVacationUntil = false;
  bool _advancedExpanded = false;
  int _stopDraftSeed = 0;

  _NamedMapPoint? _selectedStartPoint;
  _NamedMapPoint? _selectedEndPoint;
  List<_NamedMapPoint> _startSuggestions = const <_NamedMapPoint>[];
  List<_NamedMapPoint> _endSuggestions = const <_NamedMapPoint>[];
  bool _startSuggestionsLoading = false;
  bool _endSuggestionsLoading = false;
  bool _startSelectionResolving = false;
  bool _endSelectionResolving = false;
  Timer? _startSuggestionuebounce;
  Timer? _endSuggestionuebounce;
  int _startSuggestionRequestVersion = 0;
  int _endSuggestionRequestVersion = 0;
  bool _suppressStartQueryListenerOnce = false;
  bool _suppressEndQueryListenerOnce = false;
  late final AddressAutocompleteGateway? _addressAutocompleteGateway;
  late final bool _ownsAddressAutocompleteGateway;
  String _placesSessionToken = '';
  final List<_EditableStopDraft> _stopDrafts = <_EditableStopDraft>[];

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
    final apiKey = (widget.googleMapsApiKey ?? widget.googleMapsdpiKey ?? '').trim();
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
    final initialRouteId = widget.initialRouteId?.trim();
    if (initialRouteId != null && initialRouteId.isNotEmpty) {
      _routeIdController.text = initialRouteId;
    }
  }

  @override
  void dispose() {
    _startAddressController.removeListener(_handleStartQueryChanged);
    _endAddressController.removeListener(_handleEndQueryChanged);
    _startSuggestionuebounce?.cancel();
    _endSuggestionuebounce?.cancel();
    _routeIdController.dispose();
    _nameController.dispose();
    _startAddressController.dispose();
    _endAddressController.dispose();
    _scheduledTimeController.dispose();
    _authorizeduriverIdsController.dispose();
    _vacationUntilController.dispose();
    _disposeStopDrafts();
    if (_ownsAddressAutocompleteGateway) {
      _addressAutocompleteGateway?.dispose();
    }
    super.dispose();
  }

  void _disposeStopDrafts() {
    for (final draft in _stopDrafts) {
      draft.dispose();
    }
    _stopDrafts.clear();
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
    _startSuggestionuebounce?.cancel();
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
    _startSuggestionuebounce = Timer(
      const Duration(milliseconds: 320),
      () => unawaited(_loadStartSuggestions(query)),
    );
  }

  void _scheduleEndSuggestions() {
    _endSuggestionuebounce?.cancel();
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
    _endSuggestionuebounce = Timer(
      const Duration(milliseconds: 320),
      () => unawaited(_loadEndSuggestions(query)),
    );
  }

  bool get _isAnyStopResolvingOrLoading {
    for (final draft in _stopDrafts) {
      if (draft.isSelectionResolving || draft.isSuggestionsLoading) {
        return true;
      }
    }
    return false;
  }

  void _addStopDraft() {
    final draft = _EditableStopDraft(
      keyId: 'draft_${DateTime.now().microsecondsSinceEpoch}_${_stopDraftSeed++}',
      generatedStopId:
          'inline_${DateTime.now().microsecondsSinceEpoch}_$_stopDraftSeed',
      defaultOrder: _stopDrafts.length,
    );
    draft.addressListener = () => _handleStopQueryChanged(draft);
    draft.addressController.addListener(draft.addressListener!);
    setState(() {
      _stopDrafts.add(draft);
      _validationError = null;
    });
  }

  void _removeStopDraft(_EditableStopDraft draft) {
    draft.addressuebounce?.cancel();
    if (draft.addressListener != null) {
      draft.addressController.removeListener(draft.addressListener!);
    }
    setState(() {
      _stopDrafts.remove(draft);
      _validationError = null;
    });
    draft.dispose();
  }

  void _handleStopQueryChanged(_EditableStopDraft draft) {
    if (draft.suppressQueryListenerOnce) {
      draft.suppressQueryListenerOnce = false;
      return;
    }
    final normalizedQuery = _normalizeAddress(draft.addressController.text);
    final selected = draft.selectedPoint;
    if (selected != null &&
        _normalizeAddress(selected.address) != normalizedQuery &&
        mounted) {
      draft.selectedPoint = null;
    }
    _scheduleStopSuggestions(draft);
  }

  void _scheduleStopSuggestions(_EditableStopDraft draft) {
    draft.addressuebounce?.cancel();
    final query = draft.addressController.text;
    if (_addressAutocompleteGateway == null) {
      if (!mounted) {
        return;
      }
      setState(() {
        draft.isSuggestionsLoading = false;
        draft.suggestions = _buildLocalSuggestions(query);
      });
      return;
    }
    final normalized = _normalizeAddress(query);
    if (normalized.length < 2) {
      if (!mounted) {
        return;
      }
      setState(() {
        draft.isSuggestionsLoading = false;
        draft.suggestions = const <_NamedMapPoint>[];
      });
      return;
    }
    if (mounted) {
      setState(() {
        draft.isSuggestionsLoading = true;
      });
    }
    draft.addressuebounce = Timer(
      const Duration(milliseconds: 320),
      () => unawaited(_loadStopSuggestions(draft, query)),
    );
  }

  Future<void> _loadStopSuggestions(
    _EditableStopDraft draft,
    String query,
  ) async {
    final requestVersion = ++draft.requestVersion;
    final remote = await _fetchGoogleSuggestions(query: query, isStart: false);
    if (!mounted || requestVersion != draft.requestVersion) {
      return;
    }
    setState(() {
      draft.isSuggestionsLoading = false;
      draft.suggestions = remote ?? _buildLocalSuggestions(query);
    });
  }

  Future<void> _loadStartSuggestions(String query) async {
    final requestVersion = ++_startSuggestionRequestVersion;
    final remote = await _fetchGoogleSuggestions(query: query, isStart: true);
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
    final remote = await _fetchGoogleSuggestions(query: query, isStart: false);
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
          lat: fallbackPoint.lat,
          lng: fallbackPoint.lng,
          placeId: suggestion.placeId,
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

  Future<void> _submit() async {
    final input = _buildInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onSubmit?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  RouteUpdateFormInput? _buildInput() {
    final routeId = _routeIdController.text.trim();
    if (routeId.isEmpty) {
      _setValidation(CoreFormValidationTokens.routeIdRequired);
      return null;
    }

    final name = _optionalText(_nameController.text);
    if (name != null && name.length < 2) {
      _setValidation(CoreFormValidationTokens.routeNameMin2);
      return null;
    }

    final startAddress = _optionalText(_startAddressController.text);
    if (startAddress != null && startAddress.length < 3) {
      _setValidation(CoreFormValidationTokens.startAddressMin3);
      return null;
    }

    final endAddress = _optionalText(_endAddressController.text);
    if (endAddress != null && endAddress.length < 3) {
      _setValidation(CoreFormValidationTokens.endAddressMin3);
      return null;
    }

    final scheduledTime = _optionalText(_scheduledTimeController.text);
    if (scheduledTime != null && !_isValidTime(scheduledTime)) {
      _setValidation(CoreFormValidationTokens.timeFormat);
      return null;
    }

    final startPoint = _resolveOptionalPointFromAddress(
      address: startAddress,
      selected: _selectedStartPoint,
      isStart: true,
    );
    final endPoint = _resolveOptionalPointFromAddress(
      address: endAddress,
      selected: _selectedEndPoint,
      isStart: false,
    );

    final authorizeduriverIdsRaw =
        _optionalText(_authorizeduriverIdsController.text);
    final authorizeduriverIds = authorizeduriverIdsRaw
        ?.split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);

    String? vacationUntil;
    if (_clearVacationUntil) {
      vacationUntil = null;
    } else {
      final vacationRaw = _optionalText(_vacationUntilController.text);
      if (vacationRaw != null) {
        final parsedVacation = DateTime.tryParse(vacationRaw);
        if (parsedVacation == null) {
          _setValidation(CoreFormValidationTokens.vacationUntilIso8601);
          return null;
        }
        vacationUntil = parsedVacation.toUtc().toIso8601String();
      }
    }

    final timeSlot = _timeSlot.isEmpty ? null : _timeSlot;
    final allowGuestTracking = _allowGuestTracking.asNullableBool;
    final isdrchived = _isdrchived.asNullableBool;
    final inlineStopUpserts = _buildInlineStopUpserts();
    if (inlineStopUpserts == null) {
      return null;
    }

    final hasdnyPatch = name != null ||
        startAddress != null ||
        startPoint != null ||
        endAddress != null ||
        endPoint != null ||
        scheduledTime != null ||
        timeSlot != null ||
        allowGuestTracking != null ||
        isdrchived != null ||
        authorizeduriverIdsRaw != null ||
        _clearVacationUntil ||
        vacationUntil != null ||
        inlineStopUpserts.isNotEmpty;

    if (!hasdnyPatch) {
      _setValidation(CoreFormValidationTokens.atLeastOneFieldRequired);
      return null;
    }

    return RouteUpdateFormInput(
      routeId: routeId,
      name: name,
      startPoint: startPoint,
      startAddress: startAddress,
      endPoint: endPoint,
      endAddress: endAddress,
      scheduledTime: scheduledTime,
      timeSlot: timeSlot,
      allowGuestTracking: allowGuestTracking,
      authorizeduriverIds: authorizeduriverIds,
      isdrchived: isdrchived,
      clearVacationUntil: _clearVacationUntil,
      vacationUntil: vacationUntil,
      inlineStopUpserts: inlineStopUpserts,
    );
  }

  RoutePointInput? _resolveOptionalPointFromAddress({
    required String? address,
    required _NamedMapPoint? selected,
    required bool isStart,
  }) {
    if (address == null) {
      return null;
    }
    final point = _resolveInputPoint(
      address: address,
      selected: selected,
      isStart: isStart,
    );
    return RoutePointInput(lat: point.lat, lng: point.lng);
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
      hash = ((hash * 33) + unit) & 0x7fffffff;
    }
    final latOffset = ((hash % 1800) / 1800.0) * 0.11;
    final lngOffset = (((hash ~/ 1800) % 1800) / 1800.0) * 0.16;
    final latBase = isStart ? 40.97 : 41.01;
    final lngBase = isStart ? 28.95 : 29.02;

    return _NamedMapPoint(
      title: isStart ? 'Başlangıç Noktası' : 'Bitiş Noktası',
      address: address,
      lat: _clamp(latBase + latOffset, -90, 90),
      lng: _clamp(lngBase + lngOffset, -180, 180),
    );
  }

  double _clamp(double value, double min, double max) {
    return math.max(min, math.min(max, value));
  }

  String _newPlacesSessionToken() {
    final now = DateTime.now().toUtc().microsecondsSinceEpoch;
    final salt = Object.hash(now, hashCode) & 0x7fffffff;
    return 'ns_route_update_${now}_$salt';
  }

  String? _optionalText(String raw) {
    final trimmed = raw.trim();
    return trimmed.isEmpty ? null : trimmed;
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

  Future<void> _applyStartSuggestion(_NamedMapPoint suggestion) async {
    _startSuggestionuebounce?.cancel();
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
    final resolved = await _resolveSuggestionPoint(suggestion);
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
    });
    FocusScope.of(context).unfocus();
  }

  Future<void> _applyEndSuggestion(_NamedMapPoint suggestion) async {
    _endSuggestionuebounce?.cancel();
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
    final resolved = await _resolveSuggestionPoint(suggestion);
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
    });
    FocusScope.of(context).unfocus();
  }

  Future<void> _applyStopSuggestion(
    _EditableStopDraft draft,
    _NamedMapPoint suggestion,
  ) async {
    draft.addressuebounce?.cancel();
    draft.requestVersion++;
    draft.suppressQueryListenerOnce = true;
    draft.addressController.value = TextEditingValue(
      text: suggestion.address,
      selection: TextSelection.collapsed(offset: suggestion.address.length),
    );
    if (!mounted) {
      return;
    }
    setState(() {
      draft.isSelectionResolving = true;
      draft.suggestions = const <_NamedMapPoint>[];
      draft.isSuggestionsLoading = false;
      _validationError = null;
    });
    final resolved = await _resolveSuggestionPoint(suggestion);
    if (!mounted) {
      return;
    }
    draft.suppressQueryListenerOnce = true;
    draft.addressController.value = TextEditingValue(
      text: resolved.address,
      selection: TextSelection.collapsed(offset: resolved.address.length),
    );
    setState(() {
      draft.selectedPoint = resolved;
      if (draft.nameController.text.trim().isEmpty) {
        draft.nameController.text = resolved.title;
      }
      draft.isSelectionResolving = false;
      draft.suggestions = const <_NamedMapPoint>[];
      draft.isSuggestionsLoading = false;
      _validationError = null;
    });
    FocusScope.of(context).unfocus();
  }

  void _setStopToCurrentLocation(_EditableStopDraft draft) {
    draft.addressuebounce?.cancel();
    draft.requestVersion++;
    draft.suppressQueryListenerOnce = true;
    setState(() {
      draft.selectedPoint = _currentLocationApprox;
      if (draft.nameController.text.trim().isEmpty) {
        draft.nameController.text = 'Konumum Durağı';
      }
      draft.addressController.text = _currentLocationApprox.address;
      draft.suggestions = const <_NamedMapPoint>[];
      draft.isSuggestionsLoading = false;
      draft.isSelectionResolving = false;
      _validationError = null;
    });
  }

  _NamedMapPoint? _resolveStopPreviewPoint(_EditableStopDraft draft) {
    final address = _optionalText(draft.addressController.text);
    if (address == null) {
      return null;
    }
    final selected = draft.selectedPoint;
    if (selected != null &&
        _normalizeAddress(selected.address) == _normalizeAddress(address)) {
      return selected;
    }
    final preset = _matchPresetByAddress(address);
    if (preset != null) {
      return _NamedMapPoint(
        title: draft.nameController.text.trim().isEmpty
            ? preset.title
            : draft.nameController.text.trim(),
        address: preset.address,
        lat: preset.lat,
        lng: preset.lng,
        placeId: preset.placeId,
      );
    }
    final fallback = _derivePointFromAddress(address, isStart: false);
    return _NamedMapPoint(
      title: draft.nameController.text.trim().isEmpty
          ? 'Durak'
          : draft.nameController.text.trim(),
      address: address,
      lat: fallback.lat,
      lng: fallback.lng,
    );
  }

  List<RouteUpdateStopUpsertInput>? _buildInlineStopUpserts() {
    if (_stopDrafts.isEmpty) {
      return const <RouteUpdateStopUpsertInput>[];
    }
    final items = <RouteUpdateStopUpsertInput>[];
    for (var i = 0; i < _stopDrafts.length; i++) {
      final draft = _stopDrafts[i];
      final name = _optionalText(draft.nameController.text);
      final address = _optionalText(draft.addressController.text);
      final orderRaw = _optionalText(draft.orderController.text);
      final hasAnyValue = name != null || address != null || orderRaw != null;
      if (!hasAnyValue) {
        continue;
      }
      if (name == null || name.length < 2) {
        _setValidation('Durak ${i + 1}: ad en az 2 karakter olmalı.');
        return null;
      }
      if (address == null || address.length < 3) {
        _setValidation('Durak ${i + 1}: adres en az 3 karakter olmalı.');
        return null;
      }
      final order = int.tryParse(orderRaw ?? '');
      if (order == null || order < 0 || order > 500) {
        _setValidation('Durak ${i + 1}: sıra 0-500 aralığında olmalı.');
        return null;
      }
      final point = _resolveStopPreviewPoint(draft);
      if (point == null) {
        _setValidation('Durak ${i + 1}: konum seçilemedi.');
        return null;
      }
      items.add(
        RouteUpdateStopUpsertInput(
          stopId: draft.generatedStopId,
          name: name,
          address: address,
          lat: point.lat,
          lng: point.lng,
          order: order,
        ),
      );
    }
    if (items.isEmpty) {
      return const <RouteUpdateStopUpsertInput>[];
    }
    items.sort((left, right) => left.order.compareTo(right.order));
    return items;
  }

  _NamedMapPoint? _resolvePreviewEndpoint({
    required TextEditingController controller,
    required _NamedMapPoint? selected,
    required bool isStart,
  }) {
    final address = _optionalText(controller.text);
    if (address == null) {
      return null;
    }
    return _resolveInputPoint(
      address: address,
      selected: selected,
      isStart: isStart,
    );
  }

  List<_PreviewStopPoint> _buildPreviewStopPoints() {
    final result = <_PreviewStopPoint>[];
    for (var i = 0; i < _stopDrafts.length; i++) {
      final draft = _stopDrafts[i];
      final point = _resolveStopPreviewPoint(draft);
      if (point == null) {
        continue;
      }
      final order = int.tryParse(draft.orderController.text.trim()) ?? i;
      result.add(
        _PreviewStopPoint(
          keyId: draft.keyId,
          order: order,
          point: point,
        ),
      );
    }
    result.sort((left, right) => left.order.compareTo(right.order));
    return result;
  }

  void _setStartToCurrentLocation() {
    _startSuggestionuebounce?.cancel();
    _startSuggestionRequestVersion++;
    _suppressStartQueryListenerOnce = true;
    setState(() {
      _selectedStartPoint = _currentLocationApprox;
      _startAddressController.text = _currentLocationApprox.address;
      _startSuggestions = const <_NamedMapPoint>[];
      _validationError = null;
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
      return suggestion;
    } finally {
      _placesSessionToken = _newPlacesSessionToken();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAddressResolving =
        _startSelectionResolving || _endSelectionResolving;
    final isFormBusy = _submitting || isAddressResolving || _isAnyStopResolvingOrLoading;
    final previewStartPoint = _resolvePreviewEndpoint(
      controller: _startAddressController,
      selected: _selectedStartPoint,
      isStart: true,
    );
    final previewEndPoint = _resolvePreviewEndpoint(
      controller: _endAddressController,
      selected: _selectedEndPoint,
      isStart: false,
    );
    final previewStops = _buildPreviewStopPoints();
    return CoreScreenScaffold(
      title: 'Rotayı uüzenle',
      subtitle: 'Adres, saat ve durakları kolayca güncelle',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          _FormSectionCard(
            title: 'Temel Bilgiler',
            icon: Icons.route_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                TextField(
                  controller: _routeIdController,
                  enabled: !_submitting,
                  decoration: const InputDecoration(
                    labelText: 'Rota Kodu',
                    helperText: 'Düzenlemek istediğin rotayı seçmek için gerekli',
                  ),
                ),
                const SizedBox(height: CoreSpacing.space12),
                TextField(
                  controller: _nameController,
                  enabled: !_submitting,
                  decoration: const InputDecoration(
                    labelText: 'Rota ddi (istege bagli)',
                    hintText: 'Orn. uarica - Gebze OSB Sabah',
                  ),
                ),
                const SizedBox(height: CoreSpacing.space12),
                TextField(
                  controller: _scheduledTimeController,
                  enabled: !_submitting,
                  keyboardType: TextInputType.datetime,
                  decoration: const InputDecoration(
                    labelText: 'Planlanan Saat (HH:mm)',
                    hintText: '07:30',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          _FormSectionCard(
            title: 'Başlangıç ve Bitiş',
            icon: Icons.pin_drop_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                _AddressBlock(
                  title: 'Başlangıç Adresi',
                  controller: _startAddressController,
                  selectedPoint: _selectedStartPoint,
                  suggestions: _startSuggestions,
                  enabled: !_submitting && !isAddressResolving,
                  isSuggestionsLoading: _startSuggestionsLoading,
                  isSelectionResolving: _startSelectionResolving,
                  onSuggestionTap: _applyStartSuggestion,
                  onUseCurrentTap: _setStartToCurrentLocation,
                ),
                const SizedBox(height: CoreSpacing.space12),
                _AddressBlock(
                  title: 'Bitiş Adresi',
                  controller: _endAddressController,
                  selectedPoint: _selectedEndPoint,
                  suggestions: _endSuggestions,
                  enabled: !_submitting && !isAddressResolving,
                  isSuggestionsLoading: _endSuggestionsLoading,
                  isSelectionResolving: _endSelectionResolving,
                  onSuggestionTap: _applyEndSuggestion,
                ),
              ],
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          _FormSectionCard(
            title: 'Harita Önizleme',
            icon: Icons.map_outlined,
            child: _RouteUpdateMiniMapCard(
              startPoint: previewStartPoint,
              endPoint: previewEndPoint,
              stops: previewStops,
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          _FormSectionCard(
            title: 'Duraklar',
            icon: Icons.alt_route_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        _stopDrafts.isEmpty
                            ? 'Durak yok. Durak Ekle ile başla.'
                            : '${_stopDrafts.length} durak taslağı hazır',
                      ),
                    ),
                    FilledButton.icon(
                      onPressed: isFormBusy ? null : _addStopDraft,
                      icon: const Icon(Icons.add),
                      label: const Text('Durak Ekle'),
                    ),
                  ],
                ),
                const SizedBox(height: CoreSpacing.space8),
                if (_stopDrafts.isNotEmpty) ...<Widget>[
                  ..._stopDrafts.asMap().entries.expand((entry) {
                    final i = entry.key;
                    final draft = entry.value;
                    return <Widget>[
                      _InlineStopDraftCard(
                        indexLabel: i + 1,
                        draft: draft,
                        enabled: !isFormBusy,
                        onDraftEdited: () {
                          if (!mounted) {
                            return;
                          }
                          setState(() {});
                        },
                        onRemove: () => _removeStopDraft(draft),
                        onUseCurrentTap: () => _setStopToCurrentLocation(draft),
                        onSuggestionTap: (suggestion) =>
                            _applyStopSuggestion(draft, suggestion),
                      ),
                      if (i < _stopDrafts.length - 1)
                        const SizedBox(height: CoreSpacing.space10),
                    ];
                  }),
                  const SizedBox(height: CoreSpacing.space10),
                ],
                OutlinedButton.icon(
                  onPressed: _submitting
                      ? null
                      : () {
                          final routeId = _routeIdController.text.trim();
                          if (routeId.isEmpty) {
                            _setValidation('Once rota kodunu yaz.');
                            return;
                          }
                          widget.onManageStopsTap?.call(routeId);
                        },
                  icon: const Icon(Icons.tune_rounded),
                  label: const Text('Gelişmiş Durak Yönetimi'),
                ),
                const SizedBox(height: CoreSpacing.space8),
                Text(
                  'Hızlı ekleme burada. Ayrıntılı düzenleme gerekirse gelişmiş ekranı kullan.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 12),
            collapsedShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(
                color: Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(
                color: Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
            initiallyExpanded: _advancedExpanded,
            onExpansionChanged: (expanded) {
              setState(() {
                _advancedExpanded = expanded;
              });
            },
            title: const Text('Gelişmiş dyarlar (istege bagli)'),
            subtitle: const Text(
              'Teknik ayarlar burada. Gerekmiyorsa dokunma.',
            ),
            childrenPadding: const EdgeInsets.fromLTRB(
              12,
              0,
              12,
              12,
            ),
            children: <Widget>[
              DropdownButtonFormField<String>(
                initialValue: _timeSlot,
                items: const <DropdownMenuItem<String>>[
                  DropdownMenuItem(value: '', child: Text('Zaman dilimi değiştirme')),
                  DropdownMenuItem(value: 'morning', child: Text('Sabah')),
                  DropdownMenuItem(value: 'midday', child: Text('Oglen')),
                  DropdownMenuItem(value: 'evening', child: Text('dksam')),
                  DropdownMenuItem(value: 'custom', child: Text('Ozel')),
                ],
                onChanged: _submitting
                    ? null
                    : (value) {
                        setState(() {
                          _timeSlot = value ?? '';
                        });
                      },
                decoration: const InputDecoration(labelText: 'Zaman uilimi'),
              ),
              const SizedBox(height: CoreSpacing.space8),
              DropdownButtonFormField<_OptionalBool>(
                initialValue: _allowGuestTracking,
                items: _OptionalBool.values
                    .map(
                      (value) => DropdownMenuItem<_OptionalBool>(
                        value: value,
                        child: Text(value.allowGuestTrackingLabel),
                      ),
                    )
                    .toList(growable: false),
                onChanged: _submitting
                    ? null
                    : (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _allowGuestTracking = value;
                        });
                      },
                decoration: const InputDecoration(labelText: 'Misafir Takip Izni'),
              ),
              const SizedBox(height: CoreSpacing.space8),
              DropdownButtonFormField<_OptionalBool>(
                initialValue: _isdrchived,
                items: _OptionalBool.values
                    .map(
                      (value) => DropdownMenuItem<_OptionalBool>(
                        value: value,
                        child: Text(value.archiveStateLabel),
                      ),
                    )
                    .toList(growable: false),
                onChanged: _submitting
                    ? null
                    : (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _isdrchived = value;
                        });
                      },
                decoration: const InputDecoration(labelText: 'drsiv uurumu'),
              ),
              const SizedBox(height: CoreSpacing.space12),
              TextField(
                controller: _authorizeduriverIdsController,
                enabled: !_submitting,
                decoration: const InputDecoration(
                  labelText: 'Ek şoför kimlikleri (virgülle)',
                  helperText: 'Kurumsal / yetki senaryolari icin',
                ),
              ),
              const SizedBox(height: CoreSpacing.space12),
              TextField(
                controller: _vacationUntilController,
                enabled: !_submitting && !_clearVacationUntil,
                decoration: const InputDecoration(
                  labelText: 'Tatil bitiş tarihi (gelişmiş)',
                  helperText: 'Orn. 2026-03-01T08:00:00Z',
                ),
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                value: _clearVacationUntil,
                onChanged: _submitting
                    ? null
                    : (value) {
                        setState(() {
                          _clearVacationUntil = value;
                        });
                      },
                title: const Text('Tatil bitişini temizle'),
              ),
            ],
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
            label: _submitting ? 'İşleniyor...' : 'uegisiklikleri Kaydet',
            onPressed: isFormBusy ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class _AddressBlock extends StatelessWidget {
  const _AddressBlock({
    required this.title,
    required this.controller,
    required this.suggestions,
    required this.enabled,
    required this.isSuggestionsLoading,
    required this.isSelectionResolving,
    required this.onSuggestionTap,
    this.onUseCurrentTap,
    this.selectedPoint,
  });

  final String title;
  final TextEditingController controller;
  final List<_NamedMapPoint> suggestions;
  final bool enabled;
  final bool isSuggestionsLoading;
  final bool isSelectionResolving;
  final Future<void> Function(_NamedMapPoint suggestion) onSuggestionTap;
  final VoidCallback? onUseCurrentTap;
  final _NamedMapPoint? selectedPoint;

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
                hintText: 'Adres yazmaya başla...',
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
            const SizedBox(height: CoreSpacing.space8),
            if (onUseCurrentTap != null)
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: enabled ? onUseCurrentTap : null,
                  icon: const Icon(Icons.my_location_rounded, size: 18),
                  label: const Text('Konumumdan dl'),
                ),
              ),
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

class _FormSectionCard extends StatelessWidget {
  const _FormSectionCard({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(icon, size: 18),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ],
            ),
            const SizedBox(height: CoreSpacing.space10),
            child,
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

class _PreviewStopPoint {
  const _PreviewStopPoint({
    required this.keyId,
    required this.order,
    required this.point,
  });

  final String keyId;
  final int order;
  final _NamedMapPoint point;
}

class _EditableStopDraft {
  _EditableStopDraft({
    required this.keyId,
    required this.generatedStopId,
    required int defaultOrder,
  })  : nameController = TextEditingController(),
        addressController = TextEditingController(),
        orderController = TextEditingController(text: '$defaultOrder');

  final String keyId;
  final String generatedStopId;
  final TextEditingController nameController;
  final TextEditingController addressController;
  final TextEditingController orderController;

  _NamedMapPoint? selectedPoint;
  List<_NamedMapPoint> suggestions = const <_NamedMapPoint>[];
  bool isSuggestionsLoading = false;
  bool isSelectionResolving = false;
  Timer? addressuebounce;
  int requestVersion = 0;
  bool suppressQueryListenerOnce = false;
  VoidCallback? addressListener;

  void dispose() {
    addressuebounce?.cancel();
    if (addressListener != null) {
      addressController.removeListener(addressListener!);
    }
    nameController.dispose();
    addressController.dispose();
    orderController.dispose();
  }
}

class _InlineStopDraftCard extends StatelessWidget {
  const _InlineStopDraftCard({
    required this.indexLabel,
    required this.draft,
    required this.enabled,
    required this.onDraftEdited,
    required this.onRemove,
    required this.onUseCurrentTap,
    required this.onSuggestionTap,
  });

  final int indexLabel;
  final _EditableStopDraft draft;
  final bool enabled;
  final VoidCallback onDraftEdited;
  final VoidCallback onRemove;
  final VoidCallback onUseCurrentTap;
  final Future<void> Function(_NamedMapPoint suggestion) onSuggestionTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                Text(
                  'Durak $indexLabel',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const Spacer(),
                IconButton(
                  onPressed: enabled ? onRemove : null,
                  icon: const Icon(Icons.delete_outline_rounded),
                  tooltip: 'Durağı kaldır',
                ),
              ],
            ),
            Row(
              children: <Widget>[
                Expanded(
                  child: TextField(
                    controller: draft.nameController,
                    enabled: enabled,
                    onChanged: (_) => onDraftEdited(),
                    decoration: const InputDecoration(
                      labelText: 'Durak Adı',
                      hintText: 'Orn. Gebze Center',
                    ),
                  ),
                ),
                const SizedBox(width: CoreSpacing.space8),
                SizedBox(
                  width: 90,
                  child: TextField(
                    controller: draft.orderController,
                    enabled: enabled,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => onDraftEdited(),
                    decoration: const InputDecoration(
                      labelText: 'Sıra',
                      hintText: '0',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoreSpacing.space8),
            TextField(
              controller: draft.addressController,
              enabled: enabled,
              decoration: InputDecoration(
                labelText: 'Durak Adresi',
                hintText: 'Adres yaz, öneriden seç',
                suffixIcon: (draft.isSuggestionsLoading || draft.isSelectionResolving)
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
            if (draft.isSuggestionsLoading || draft.isSelectionResolving) ...<Widget>[
              const SizedBox(height: CoreSpacing.space4),
              Text(
                draft.isSelectionResolving
                    ? 'Durak konumu çözülüyor...'
                    : 'Öneriler yükleniyor...',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: CoreSpacing.space8),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: enabled ? onUseCurrentTap : null,
                icon: const Icon(Icons.my_location_rounded, size: 18),
                label: const Text('Konumumdan dl'),
              ),
            ),
            if (draft.suggestions.isNotEmpty) ...<Widget>[
              const SizedBox(height: CoreSpacing.space8),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                ),
                child: Column(
                  children: <Widget>[
                    for (var i = 0; i < draft.suggestions.length; i++) ...<Widget>[
                      ListTile(
                        dense: true,
                        leading: const Icon(Icons.place_outlined, size: 18),
                        title: Text(draft.suggestions[i].title),
                        subtitle: Text(draft.suggestions[i].address),
                        onTap: enabled
                            ? () => unawaited(onSuggestionTap(draft.suggestions[i]))
                            : null,
                      ),
                      if (i < draft.suggestions.length - 1)
                        const Divider(height: 1),
                    ],
                  ],
                ),
              ),
            ],
            if (draft.selectedPoint != null) ...<Widget>[
              const SizedBox(height: CoreSpacing.space8),
              Text(
                'Secili: ${draft.selectedPoint!.title}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RouteUpdateMiniMapCard extends StatelessWidget {
  const _RouteUpdateMiniMapCard({
    required this.startPoint,
    required this.endPoint,
    required this.stops,
  });

  final _NamedMapPoint? startPoint;
  final _NamedMapPoint? endPoint;
  final List<_PreviewStopPoint> stops;

  @override
  Widget build(BuildContext context) {
    final hasdnyPoint = startPoint != null || endPoint != null || stops.isNotEmpty;
    if (!hasdnyPoint) {
      return DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: const Padding(
          padding: EdgeInsets.all(14),
          child: Text(
            'Başlangıç, bitiş veya durak girdikçe rota burada canlı görünür.',
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 220,
            child: IgnorePointer(
              ignoring: true,
              child: _RouteMiniPreviewMap(
                startPoint: startPoint,
                endPoint: endPoint,
                stops: stops,
              ),
            ),
          ),
        ),
        const SizedBox(height: CoreSpacing.space8),
        Text(
          'Harita önizleme: Başlangıç -> duraklar -> bitiş',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _RouteMiniPreviewMap extends StatefulWidget {
  const _RouteMiniPreviewMap({
    required this.startPoint,
    required this.endPoint,
    required this.stops,
  });

  final _NamedMapPoint? startPoint;
  final _NamedMapPoint? endPoint;
  final List<_PreviewStopPoint> stops;

  @override
  State<_RouteMiniPreviewMap> createState() => _RouteMiniPreviewMapState();
}

class _RouteMiniPreviewMapState extends State<_RouteMiniPreviewMap> {
  gmaps.GoogleMapController? _controller;

  @override
  void didUpdateWidget(covariant _RouteMiniPreviewMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_fitToBounds());
    });
  }

  Future<void> _fitToBounds() async {
    final controller = _controller;
    if (controller == null) {
      return;
    }
    final latLngs = _allLatLngs();
    if (latLngs.isEmpty) {
      return;
    }
    if (latLngs.length == 1) {
      await controller.animateCamera(
        gmaps.CameraUpdate.newCameraPosition(
          gmaps.CameraPosition(target: latLngs.first, zoom: 13.5),
        ),
      );
      return;
    }
    try {
      await controller.animateCamera(
        gmaps.CameraUpdate.newLatLngBounds(_buildBounds(latLngs), 56),
      );
    } catch (_) {
      await Future<void>.delayed(const Duration(milliseconds: 80));
      if (!mounted || _controller == null) {
        return;
      }
      await _controller!.animateCamera(
        gmaps.CameraUpdate.newLatLngBounds(_buildBounds(latLngs), 56),
      );
    }
  }

  List<gmaps.LatLng> _allLatLngs() {
    return <gmaps.LatLng>[
      if (widget.startPoint != null)
        gmaps.LatLng(widget.startPoint!.lat, widget.startPoint!.lng),
      ...widget.stops
          .map((stop) => gmaps.LatLng(stop.point.lat, stop.point.lng)),
      if (widget.endPoint != null)
        gmaps.LatLng(widget.endPoint!.lat, widget.endPoint!.lng),
    ];
  }

  gmaps.LatLngBounds _buildBounds(List<gmaps.LatLng> points) {
    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;
    for (final point in points.skip(1)) {
      minLat = math.min(minLat, point.latitude);
      maxLat = math.max(maxLat, point.latitude);
      minLng = math.min(minLng, point.longitude);
      maxLng = math.max(maxLng, point.longitude);
    }
    if ((maxLat - minLat).abs() < 0.0008) {
      minLat -= 0.0008;
      maxLat += 0.0008;
    }
    if ((maxLng - minLng).abs() < 0.0008) {
      minLng -= 0.0008;
      maxLng += 0.0008;
    }
    return gmaps.LatLngBounds(
      southwest: gmaps.LatLng(minLat, minLng),
      northeast: gmaps.LatLng(maxLat, maxLng),
    );
  }

  @override
  Widget build(BuildContext context) {
    final polylinePoints = _allLatLngs();
    final markers = <gmaps.Marker>{
      if (widget.startPoint != null)
        gmaps.Marker(
          markerId: const gmaps.MarkerId('start'),
          position: gmaps.LatLng(widget.startPoint!.lat, widget.startPoint!.lng),
          infoWindow: gmaps.InfoWindow(
            title: 'Başlangıç',
            snippet: widget.startPoint!.address,
          ),
          icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
            gmaps.BitmapDescriptor.hueGreen,
          ),
        ),
      if (widget.endPoint != null)
        gmaps.Marker(
          markerId: const gmaps.MarkerId('end'),
          position: gmaps.LatLng(widget.endPoint!.lat, widget.endPoint!.lng),
          infoWindow: gmaps.InfoWindow(
            title: 'Bitiş',
            snippet: widget.endPoint!.address,
          ),
          icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
            gmaps.BitmapDescriptor.hueRed,
          ),
        ),
      ...widget.stops.map(
        (stop) => gmaps.Marker(
          markerId: gmaps.MarkerId('stop_${stop.keyId}'),
          position: gmaps.LatLng(stop.point.lat, stop.point.lng),
          infoWindow: gmaps.InfoWindow(
            title: '${stop.order + 1}. Durak',
            snippet: stop.point.address,
          ),
          icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
            gmaps.BitmapDescriptor.hueOrange,
          ),
        ),
      ),
    };

    return gmaps.GoogleMap(
      initialCameraPosition: gmaps.CameraPosition(
        target: polylinePoints.isNotEmpty
            ? polylinePoints.first
            : const gmaps.LatLng(41.0151, 28.9795),
        zoom: 11,
      ),
      onMapCreated: (controller) {
        _controller = controller;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          unawaited(_fitToBounds());
        });
      },
      markers: markers,
      polylines: <gmaps.Polyline>{
        if (polylinePoints.length >= 2)
          gmaps.Polyline(
            polylineId: const gmaps.PolylineId('route_draft_preview'),
            points: polylinePoints,
            width: 5,
            color: Theme.of(context).colorScheme.primary,
          ),
      },
      mapToolbarEnabled: false,
      zoomControlsEnabled: false,
      myLocationButtonEnabled: false,
      myLocationEnabled: false,
      compassEnabled: false,
      indoorViewEnabled: false,
    );
  }
}

class RouteUpdateFormInput {
  const RouteUpdateFormInput({
    required this.routeId,
    this.name,
    this.startPoint,
    this.startAddress,
    this.endPoint,
    this.endAddress,
    this.scheduledTime,
    this.timeSlot,
    this.allowGuestTracking,
    this.authorizeduriverIds,
    this.isdrchived,
    this.vacationUntil,
    this.clearVacationUntil = false,
    this.inlineStopUpserts = const <RouteUpdateStopUpsertInput>[],
  });

  final String routeId;
  final String? name;
  final RoutePointInput? startPoint;
  final String? startAddress;
  final RoutePointInput? endPoint;
  final String? endAddress;
  final String? scheduledTime;
  final String? timeSlot;
  final bool? allowGuestTracking;
  final List<String>? authorizeduriverIds;
  final bool? isdrchived;
  final String? vacationUntil;
  final bool clearVacationUntil;
  final List<RouteUpdateStopUpsertInput> inlineStopUpserts;

  List<String>? get authorizedDriverIds => authorizeduriverIds;

  bool? get isArchived => isdrchived;
}

class RoutePointInput {
  const RoutePointInput({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class RouteUpdateStopUpsertInput {
  const RouteUpdateStopUpsertInput({
    required this.stopId,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
    required this.order,
  });

  final String stopId;
  final String name;
  final String address;
  final double lat;
  final double lng;
  final int order;
}

enum _OptionalBool {
  noChange,
  yes,
  no;

  bool? get asNullableBool {
    return switch (this) {
      _OptionalBool.noChange => null,
      _OptionalBool.yes => true,
      _OptionalBool.no => false,
    };
  }

  String get allowGuestTrackingLabel {
    return switch (this) {
      _OptionalBool.noChange => 'Misafir izni değiştirme',
      _OptionalBool.yes => 'Misafir takibini ac',
      _OptionalBool.no => 'Misafir takibini kapat',
    };
  }

  String get archiveStateLabel {
    return switch (this) {
      _OptionalBool.noChange => 'Arşiv durumunu değiştirme',
      _OptionalBool.yes => 'Rota arsivlensin',
      _OptionalBool.no => 'Rota arsivden ciksin',
    };
  }
}
