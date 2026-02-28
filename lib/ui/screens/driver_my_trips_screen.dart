import 'package:flutter/material.dart';

import '../tokens/core_colors.dart';
import '../tokens/core_typography.dart';
import '../tokens/icon_tokens.dart';
import 'driver_trips_models.dart';

enum DriverMyTripsFilter {
  today,
  upcoming,
  history,
}

class DriverMyTripsScreen extends StatefulWidget {
  const DriverMyTripsScreen({
    super.key,
    required this.loadItems,
    this.onTripTap,
  });

  final Future<List<DriverTripListItem>> Function() loadItems;
  final ValueChanged<DriverTripListItem>? onTripTap;

  @override
  State<DriverMyTripsScreen> createState() => _DriverMyTripsScreenState();
}

class _DriverMyTripsScreenState extends State<DriverMyTripsScreen> {
  DriverMyTripsFilter _activeFilter = DriverMyTripsFilter.today;
  bool _loading = true;
  String? _errorMessage;
  List<DriverTripListItem> _items = const <DriverTripListItem>[];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final items = await widget.loadItems();
      if (!mounted) {
        return;
      }
      setState(() {
        _items = items;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Seferler yüklenemedi.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  List<DriverTripListItem> get _filteredItems {
    final now = DateTime.now();
    final nowDate = DateTime(now.year, now.month, now.day);

    bool isSameDay(DateTime value) {
      return value.year == nowDate.year &&
          value.month == nowDate.month &&
          value.day == nowDate.day;
    }

    final filtered = _items.where((item) {
      switch (_activeFilter) {
        case DriverMyTripsFilter.today:
          if (item.isHistory) {
            return false;
          }
          final plannedAt = item.plannedAtLocal;
          if (plannedAt == null) {
            return true;
          }
          return isSameDay(plannedAt);
        case DriverMyTripsFilter.upcoming:
          if (item.isHistory || item.status == DriverTripCardStatus.live) {
            return false;
          }
          final plannedAt = item.plannedAtLocal;
          if (plannedAt == null) {
            return true;
          }
          return plannedAt.isAfter(now);
        case DriverMyTripsFilter.history:
          return item.isHistory;
      }
    }).toList(growable: false);

    filtered.sort((left, right) {
      if (left.isHistory != right.isHistory) {
        return left.isHistory ? 1 : -1;
      }
      if (left.status == DriverTripCardStatus.live &&
          right.status != DriverTripCardStatus.live) {
        return -1;
      }
      if (right.status == DriverTripCardStatus.live &&
          left.status != DriverTripCardStatus.live) {
        return 1;
      }
      if (_activeFilter == DriverMyTripsFilter.history) {
        return right.sortAtUtc.compareTo(left.sortAtUtc);
      }
      final leftPlanned = left.plannedAtLocal;
      final rightPlanned = right.plannedAtLocal;
      if (leftPlanned != null && rightPlanned != null) {
        return leftPlanned.compareTo(rightPlanned);
      }
      if (leftPlanned == null && rightPlanned != null) {
        return 1;
      }
      if (leftPlanned != null && rightPlanned == null) {
        return -1;
      }
      return left.routeName.compareTo(right.routeName);
    });
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final filteredItems = _filteredItems;
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F7F8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(CoreIconTokens.back),
          color: CoreColors.ink900,
          tooltip: 'Geri',
        ),
        title: const Text(
          'Seferlerim',
          style: TextStyle(
            fontFamily: CoreTypography.headingFamily,
            fontWeight: FontWeight.w800,
            fontSize: 20,
            color: CoreColors.ink900,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: <Widget>[
            _DriverTripsFilterBar(
              activeFilter: _activeFilter,
              onChanged: (value) {
                setState(() {
                  _activeFilter = value;
                });
              },
            ),
            const SizedBox(height: 18),
            if (_loading)
              const _TripsLoadingState()
            else if (_errorMessage != null)
              _TripsErrorState(
                message: _errorMessage!,
                onRetryTap: _load,
              )
            else if (filteredItems.isEmpty)
              _TripsEmptyState(filter: _activeFilter)
            else
              ...filteredItems.asMap().entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _DriverTripCard(
                    item: entry.value,
                    showPrimaryAction:
                        _activeFilter != DriverMyTripsFilter.history &&
                        entry.key == 0,
                    onTap: () => widget.onTripTap?.call(entry.value),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DriverTripsFilterBar extends StatelessWidget {
  const _DriverTripsFilterBar({
    required this.activeFilter,
    required this.onChanged,
  });

  final DriverMyTripsFilter activeFilter;
  final ValueChanged<DriverMyTripsFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EDF3),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: <Widget>[
          _FilterPill(
            label: 'Bugün',
            selected: activeFilter == DriverMyTripsFilter.today,
            onTap: () => onChanged(DriverMyTripsFilter.today),
          ),
          _FilterPill(
            label: 'Yaklaşan',
            selected: activeFilter == DriverMyTripsFilter.upcoming,
            onTap: () => onChanged(DriverMyTripsFilter.upcoming),
          ),
          _FilterPill(
            label: 'Geçmiş',
            selected: activeFilter == DriverMyTripsFilter.history,
            onTap: () => onChanged(DriverMyTripsFilter.history),
          ),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            boxShadow: selected
                ? const <BoxShadow>[
                    BoxShadow(
                      color: Color(0x12000000),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: selected ? const Color(0xFF111827) : const Color(0xFF64748B),
            ),
          ),
        ),
      ),
    );
  }
}

class _DriverTripCard extends StatelessWidget {
  const _DriverTripCard({
    required this.item,
    required this.showPrimaryAction,
    this.onTap,
  });

  final DriverTripListItem item;
  final bool showPrimaryAction;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final plannedTimeLabel = item.scheduledTimeLabel?.trim();
    final timeValue = item.isHistory
        ? _formatDateTime(item.sortAtUtc)
        : (plannedTimeLabel == null || plannedTimeLabel.isEmpty)
            ? 'Belirtilmedi'
            : plannedTimeLabel;
    final passengerLabel = item.passengerCount == null
        ? '0 personel kayıtlı'
        : '${item.passengerCount} personel kayıtlı';
    final showStartButton = showPrimaryAction &&
        !item.isHistory &&
        item.status != DriverTripCardStatus.completed &&
        item.status != DriverTripCardStatus.canceled;
    final primaryLabel = item.status == DriverTripCardStatus.live
        ? 'SEFERE DÖN'
        : 'SEFERİ BAŞLAT';

    return InkWell(
      borderRadius: BorderRadius.circular(26),
      onTap: onTap,
      child: Ink(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: const Color(0xFFE7EDF3)),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Expanded(
                    child: Text(
                      _toTurkishUpper(item.routeName),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: CoreTypography.headingFamily,
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _StatusChip(status: item.status),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: <Widget>[
                  const Text(
                    'Planlanan:',
                    style: TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      timeValue,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w800,
                        fontSize: 17,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _RouteLegBlock(
                startAddress: item.startAddress,
                endAddress: item.endAddress,
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: Color(0xFFE9EEF3)),
              const SizedBox(height: 10),
              Row(
                children: <Widget>[
                  Expanded(
                    child: Row(
                      children: <Widget>[
                        const Icon(
                          Icons.group_outlined,
                          size: 18,
                          color: Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            passengerLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: CoreTypography.bodyFamily,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: onTap,
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 8,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: const Icon(Icons.map_outlined, size: 18),
                    label: const Text(
                      'HARİTADA GÖR',
                      style: TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ],
              ),
              if (showStartButton) ...<Widget>[
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onTap,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: Text(
                      primaryLabel,
                      style: const TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final DriverTripCardStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, background, foreground, borderColor) = switch (status) {
      DriverTripCardStatus.live => (
          'CANLI',
          const Color(0xFF111111),
          const Color(0xFFFBBF24),
          null,
        ),
      DriverTripCardStatus.planned => (
          'PLANLI',
          const Color(0xFFF1F5F9),
          const Color(0xFF64748B),
          const Color(0xFFD9E2EC),
        ),
      DriverTripCardStatus.completed => (
          'TAMAM',
          const Color(0xFFE9F7EC),
          const Color(0xFF138F3E),
          null,
        ),
      DriverTripCardStatus.canceled => (
          'İPTAL',
          const Color(0xFFFCEDEC),
          const Color(0xFFB42318),
          null,
        ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(10),
        border: borderColor == null ? null : Border.all(color: borderColor),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w800,
          fontSize: 11,
          letterSpacing: 1,
          color: foreground,
        ),
      ),
    );
  }
}

class _RouteLegBlock extends StatelessWidget {
  const _RouteLegBlock({
    required this.startAddress,
    required this.endAddress,
  });

  final String startAddress;
  final String endAddress;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const SizedBox(
          width: 30,
          child: Column(
            children: <Widget>[
              _RouteNodeCircle(),
              _RouteNodeLine(),
              _RouteNodeSquare(),
            ],
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _RouteLegInfo(
                label: 'BAŞLANGIÇ',
                value: startAddress,
              ),
              const SizedBox(height: 12),
              _RouteLegInfo(
                label: 'BİTİŞ',
                value: endAddress,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RouteLegInfo extends StatelessWidget {
  const _RouteLegInfo({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: const TextStyle(
            fontFamily: CoreTypography.bodyFamily,
            fontWeight: FontWeight.w700,
            fontSize: 12,
            letterSpacing: 0.7,
            color: Color(0xFFB0BCCB),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value.trim().isEmpty ? '-' : value,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontFamily: CoreTypography.bodyFamily,
            fontWeight: FontWeight.w600,
            fontSize: 14,
            height: 1.35,
            color: Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }
}

class _RouteNodeCircle extends StatelessWidget {
  const _RouteNodeCircle();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: Border.all(
          color: const Color(0xFF0F172A),
          width: 2,
        ),
      ),
    );
  }
}

class _RouteNodeLine extends StatelessWidget {
  const _RouteNodeLine();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 2,
      height: 38,
      margin: const EdgeInsets.symmetric(vertical: 2),
      color: const Color(0xFFDCE3EA),
    );
  }
}

class _RouteNodeSquare extends StatelessWidget {
  const _RouteNodeSquare();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        shape: BoxShape.rectangle,
      ),
    );
  }
}

class _TripsLoadingState extends StatelessWidget {
  const _TripsLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48),
      child: Center(child: CircularProgressIndicator()),
    );
  }
}

class _TripsErrorState extends StatelessWidget {
  const _TripsErrorState({
    required this.message,
    required this.onRetryTap,
  });

  final String message;
  final VoidCallback onRetryTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE4E7EA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            message,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: CoreColors.ink700,
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: onRetryTap,
            child: const Text('Tekrar dene'),
          ),
        ],
      ),
    );
  }
}

class _TripsEmptyState extends StatelessWidget {
  const _TripsEmptyState({required this.filter});

  final DriverMyTripsFilter filter;

  @override
  Widget build(BuildContext context) {
    final message = switch (filter) {
      DriverMyTripsFilter.today => 'Bugün görüntülenecek sefer yok.',
      DriverMyTripsFilter.upcoming => 'Yaklaşan planlı sefer yok.',
      DriverMyTripsFilter.history => 'Sefer geçmişi henüz oluşmadı.',
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE4E7EA)),
      ),
      child: Text(
        message,
        style: const TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: CoreColors.ink700,
        ),
      ),
    );
  }
}

String _formatDateTime(DateTime valueUtc) {
  final local = valueUtc.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final year = local.year.toString();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '$day.$month.$year · $hour:$minute';
}

String _toTurkishUpper(String input) {
  return input
      .replaceAll('i', 'İ')
      .replaceAll('ı', 'I')
      .replaceAll('ş', 'Ş')
      .replaceAll('ğ', 'Ğ')
      .replaceAll('ü', 'Ü')
      .replaceAll('ö', 'Ö')
      .replaceAll('ç', 'Ç')
      .toUpperCase();
}
