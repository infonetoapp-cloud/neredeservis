import 'package:flutter/material.dart';

import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/icon_tokens.dart';

enum TripHistoryAudience {
  driver,
  passenger,
}

enum TripHistoryStatus {
  completed,
  partial,
  unknown,
}

enum TripHistoryFilter {
  all,
  thisMonth,
  lastMonth,
}

class TripHistoryItem {
  const TripHistoryItem({
    required this.tripId,
    required this.routeId,
    required this.routeName,
    required this.referenceAtUtc,
    required this.counterpartLabel,
    required this.status,
    this.durationMinutes,
    this.counterpartPhotoUrl,
  });

  final String tripId;
  final String routeId;
  final String routeName;
  final DateTime referenceAtUtc;
  final String counterpartLabel;
  final TripHistoryStatus status;
  final int? durationMinutes;
  final String? counterpartPhotoUrl;
}

class TripHistoryScreen extends StatefulWidget {
  const TripHistoryScreen({
    super.key,
    required this.audience,
    required this.loadItems,
    this.title = 'Sefer Geçmişi',
    this.onDetailTap,
  });

  final TripHistoryAudience audience;
  final Future<List<TripHistoryItem>> Function() loadItems;
  final String title;
  final ValueChanged<TripHistoryItem>? onDetailTap;

  @override
  State<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends State<TripHistoryScreen> {
  TripHistoryFilter _activeFilter = TripHistoryFilter.all;
  bool _loading = true;
  String? _errorMessage;
  List<TripHistoryItem> _items = const <TripHistoryItem>[];

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
        _errorMessage = 'Sefer geçmişi yuklenemedi.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  List<TripHistoryItem> get _filteredItems {
    if (_activeFilter == TripHistoryFilter.all) {
      return _items;
    }

    final now = DateTime.now();
    final thisMonth = DateTime(now.year, now.month);
    final lastMonth = DateTime(now.year, now.month - 1);

    return _items.where((item) {
      final local = item.referenceAtUtc.toLocal();
      final itemMonth = DateTime(local.year, local.month);
      if (_activeFilter == TripHistoryFilter.thisMonth) {
        return itemMonth == thisMonth;
      }
      return itemMonth == lastMonth;
    }).toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F6F6),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F6F6),
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(CoreIconTokens.back),
          color: CoreColors.ink900,
          tooltip: 'Geri',
        ),
        title: Text(
          widget.title,
          style: const TextStyle(
            fontFamily: CoreTypography.headingFamily,
            fontWeight: FontWeight.w700,
            fontSize: 22,
            color: CoreColors.ink900,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            CoreSpacing.space16,
            CoreSpacing.space12,
            CoreSpacing.space16,
            CoreSpacing.space20,
          ),
          children: <Widget>[
            _HistoryFilterBar(
              activeFilter: _activeFilter,
              onChanged: (nextFilter) {
                setState(() {
                  _activeFilter = nextFilter;
                });
              },
            ),
            const SizedBox(height: CoreSpacing.space16),
            if (_loading)
              const _LoadingState()
            else if (_errorMessage != null)
              _ErrorState(
                message: _errorMessage!,
                onRetryTap: _load,
              )
            else if (_filteredItems.isEmpty)
              _EmptyState(audience: widget.audience)
            else
              ..._filteredItems.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: CoreSpacing.space16),
                  child: _TripHistoryCard(
                    item: item,
                    onDetailTap: () {
                      final handler = widget.onDetailTap;
                      if (handler != null) {
                        handler(item);
                        return;
                      }
                      _showTripDetailSheet(context, item);
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _showTripDetailSheet(
    BuildContext context,
    TripHistoryItem item,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: CoreColors.surface0,
      showDragHandle: true,
      builder: (context) {
        final statusLabel = _statusLabel(item.status);
        final durationLabel = item.durationMinutes == null
            ? '-- dk'
            : '${item.durationMinutes} dk';
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              CoreSpacing.space16,
              CoreSpacing.space8,
              CoreSpacing.space16,
              CoreSpacing.space20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  item.routeName,
                  style: const TextStyle(
                    fontFamily: CoreTypography.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 22,
                    color: CoreColors.ink900,
                  ),
                ),
                const SizedBox(height: CoreSpacing.space12),
                Text('Tarih: ${_formatDateLabel(item.referenceAtUtc)}'),
                const SizedBox(height: CoreSpacing.space8),
                Text('Sure: $durationLabel'),
                const SizedBox(height: CoreSpacing.space8),
                Text(item.counterpartLabel),
                const SizedBox(height: CoreSpacing.space8),
                Text('Durum: $statusLabel'),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HistoryFilterBar extends StatelessWidget {
  const _HistoryFilterBar({
    required this.activeFilter,
    required this.onChanged,
  });

  final TripHistoryFilter activeFilter;
  final ValueChanged<TripHistoryFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: const Color(0xFFE9E9E9),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Row(
        children: <Widget>[
          _FilterTab(
            label: 'Tumu',
            active: activeFilter == TripHistoryFilter.all,
            onTap: () => onChanged(TripHistoryFilter.all),
          ),
          _FilterTab(
            label: 'Bu Ay',
            active: activeFilter == TripHistoryFilter.thisMonth,
            onTap: () => onChanged(TripHistoryFilter.thisMonth),
          ),
          _FilterTab(
            label: 'Gecen Ay',
            active: activeFilter == TripHistoryFilter.lastMonth,
            onTap: () => onChanged(TripHistoryFilter.lastMonth),
          ),
        ],
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  const _FilterTab({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(vertical: 13),
          decoration: BoxDecoration(
            color: active ? CoreColors.surface0 : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
            boxShadow: active
                ? const <BoxShadow>[
                    BoxShadow(
                      color: Color(0x12000000),
                      blurRadius: 10,
                      offset: Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: active ? CoreColors.ink900 : CoreColors.ink700,
            ),
          ),
        ),
      ),
    );
  }
}

class _TripHistoryCard extends StatelessWidget {
  const _TripHistoryCard({
    required this.item,
    required this.onDetailTap,
  });

  final TripHistoryItem item;
  final VoidCallback onDetailTap;

  @override
  Widget build(BuildContext context) {
    final durationLabel =
        item.durationMinutes == null ? '-- dk' : '${item.durationMinutes} dk';
    final statusLabel = _statusLabel(item.status);
    final statusColor = _statusColor(item.status);
    final photoUrl = item.counterpartPhotoUrl?.trim();
    final hasPhoto = photoUrl != null && photoUrl.isNotEmpty;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: CoreColors.surface0,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE4E4E4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          CoreSpacing.space16,
          CoreSpacing.space16,
          CoreSpacing.space16,
          CoreSpacing.space16,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    _formatDateLabel(item.referenceAtUtc),
                    style: const TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      letterSpacing: 1.0,
                      color: Color(0xFF9A9A9A),
                    ),
                  ),
                ),
                Text(
                  durationLabel,
                  style: const TextStyle(
                    fontFamily: CoreTypography.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 22,
                    color: CoreColors.ink900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoreSpacing.space8),
            Text(
              item.routeName,
              style: const TextStyle(
                fontFamily: CoreTypography.headingFamily,
                fontWeight: FontWeight.w700,
                fontSize: 23,
                color: CoreColors.ink900,
              ),
            ),
            const SizedBox(height: CoreSpacing.space12),
            const Divider(height: 1, color: Color(0xFFE7E7E7)),
            const SizedBox(height: CoreSpacing.space12),
            Row(
              children: <Widget>[
                CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFFE6E6E6),
                  backgroundImage: hasPhoto ? NetworkImage(photoUrl) : null,
                  child: hasPhoto
                      ? null
                      : const Icon(
                          Icons.person_rounded,
                          color: Color(0xFF6D6D6D),
                          size: 20,
                        ),
                ),
                const SizedBox(width: CoreSpacing.space12),
                Expanded(
                  child: Text(
                    item.counterpartLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: CoreColors.ink700,
                    ),
                  ),
                ),
                const SizedBox(width: CoreSpacing.space8),
                Text(
                  statusLabel,
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: statusColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoreSpacing.space12),
            const Divider(height: 1, color: Color(0xFFE7E7E7)),
            const SizedBox(height: CoreSpacing.space8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onDetailTap,
                style: TextButton.styleFrom(
                  foregroundColor: CoreColors.ink900,
                  textStyle: const TextStyle(
                    fontFamily: CoreTypography.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 20,
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text('Detayları Gör'),
                    SizedBox(width: 6),
                    Icon(CoreIconTokens.caretRight, size: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 320,
      child: Center(
        child: CircularProgressIndicator.adaptive(),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetryTap,
  });

  final String message;
  final VoidCallback onRetryTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 280,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text(
              message,
              style: const TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                color: CoreColors.ink700,
              ),
            ),
            const SizedBox(height: CoreSpacing.space12),
            TextButton(
              onPressed: onRetryTap,
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.audience,
  });

  final TripHistoryAudience audience;

  @override
  Widget build(BuildContext context) {
    final description = audience == TripHistoryAudience.driver
        ? 'Şoför icin geçmiş sefer kaydi bulunamadi.'
        : 'Yolcu icin geçmiş sefer kaydi bulunamadi.';
    return SizedBox(
      height: 300,
      child: Center(
        child: Text(
          description,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: CoreTypography.bodyFamily,
            fontWeight: FontWeight.w600,
            color: CoreColors.ink700,
          ),
        ),
      ),
    );
  }
}

String _statusLabel(TripHistoryStatus status) {
  return switch (status) {
    TripHistoryStatus.completed => 'TAMAMLANDI',
    TripHistoryStatus.partial => 'YARIM KALDI',
    TripHistoryStatus.unknown => 'BILINMIYOR',
  };
}

Color _statusColor(TripHistoryStatus status) {
  return switch (status) {
    TripHistoryStatus.completed => CoreColors.success,
    TripHistoryStatus.partial => CoreColors.warningStrong,
    TripHistoryStatus.unknown => CoreColors.ink500,
  };
}

String _formatDateLabel(DateTime dateUtc) {
  final local = dateUtc.toLocal();
  final month = switch (local.month) {
    1 => 'OCAK',
    2 => 'SUBAT',
    3 => 'MART',
    4 => 'NISAN',
    5 => 'MAYIS',
    6 => 'HAZIRAN',
    7 => 'TEMMUZ',
    8 => 'AGUSTOS',
    9 => 'EYLUL',
    10 => 'EKIM',
    11 => 'KASIM',
    12 => 'ARALIK',
    _ => '',
  };
  return '${local.day.toString().padLeft(2, '0')} $month ${local.year}';
}
