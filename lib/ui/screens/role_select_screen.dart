import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../tokens/icon_tokens.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({
    super.key,
    required this.appName,
    this.onDriverTap,
    this.onPassengerTap,
    this.onGuestTap,
  });

  static const String _logoAssetPath = 'assets/images/logo.png';

  final String appName;
  final VoidCallback? onDriverTap;
  final VoidCallback? onPassengerTap;
  final VoidCallback? onGuestTap;

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F5),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            20,
            14,
            20,
            math.max(20, mediaQuery.padding.bottom + 8),
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 390),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  const _TopLogo(assetPath: _logoAssetPath),
                  const SizedBox(height: 18),
                  Text(
                    'Nas\u0131l Devam Etmek\n\u0130stersin?',
                    textAlign: TextAlign.center,
                    style: _RoleTextStyles.title(context),
                  ),
                  const SizedBox(height: 12),
                  Center(
                    child: Transform.rotate(
                      angle: -4 * math.pi / 180,
                      child: Container(
                        width: 120,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0E0E0E),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Sana uygun deneyimi haz\u0131rlayal\u0131m.',
                    textAlign: TextAlign.center,
                    style: _RoleTextStyles.subtitle(context),
                  ),
                  const SizedBox(height: 24),
                  _DriverHeroCard(onPressed: onDriverTap),
                  const SizedBox(height: 16),
                  _PassengerCard(onPressed: onPassengerTap),
                  const SizedBox(height: 16),
                  _GuestCard(onPressed: onGuestTap),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TopLogo extends StatelessWidget {
  const _TopLogo({required this.assetPath});

  final String assetPath;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: const Color(0xFF0E0E0E).withAlpha(60),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Image.asset(
          assetPath,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) {
            return DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xFF0F3D3E),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text('Ni', style: _RoleTextStyles.logoFallback(context)),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _DriverHeroCard extends StatelessWidget {
  const _DriverHeroCard({required this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return _RoleCardTapArea(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        height: 168,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: <Color>[Color(0xFF0F3D3E), Color(0xFF1E6F5C)],
          ),
          border: Border.all(color: const Color(0xFF0E0E0E), width: 1.5),
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: const Color(0xFF4EFFC3).withAlpha(46),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.black.withAlpha(36),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      CoreIconTokens.bus,
                      color: Color(0xFF0E0E0E),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text('\u015eof\u00f6r',
                            style: _RoleTextStyles.driverTitle(context)),
                        const SizedBox(height: 6),
                        Text(
                          'Seferi ba\u015flat, yolcular seni g\u00f6rs\u00fcn.',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: _RoleTextStyles.driverDescription(context),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),
              _RoleActionButton(
                label: '\u015eof\u00f6r Olarak Devam Et',
                onPressed: onPressed,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCardTapArea extends StatelessWidget {
  const _RoleCardTapArea({
    required this.onTap,
    required this.borderRadius,
    required this.child,
  });

  final VoidCallback? onTap;
  final BorderRadius borderRadius;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius,
        child: child,
      ),
    );
  }
}

class _PassengerCard extends StatelessWidget {
  const _PassengerCard({required this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: <Widget>[
        _RoleCardTapArea(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            constraints: const BoxConstraints(minHeight: 164),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E4E1)),
              boxShadow: <BoxShadow>[
                BoxShadow(
                  color: Colors.black.withAlpha(18),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
              child: Column(
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      const _PassengerIconBadge(),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text('Yolcu',
                                style: _RoleTextStyles.cardTitle(context)),
                            const SizedBox(height: 2),
                            Text(
                              'Kodla kat\u0131l, servisin nerede oldu\u011funu\nan\u0131nda g\u00f6r.',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: _RoleTextStyles.cardDescription(context),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _RoleActionButton(
                    label: 'Yolcu Olarak Devam Et',
                    onPressed: onPressed,
                  ),
                ],
              ),
            ),
          ),
        ),
        Positioned(
          left: 0,
          top: 36,
          child: Container(
            width: 4,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFF0E0E0E),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ],
    );
  }
}

class _PassengerIconBadge extends StatelessWidget {
  const _PassengerIconBadge();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 44,
      child: Stack(
        children: <Widget>[
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: <Color>[Color(0xFFFFF3DA), Color(0xFFF5D383)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: const Icon(
              CoreIconTokens.userPin,
              size: 22,
              color: Color(0xFF8A5A00),
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: Colors.black.withAlpha(32),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                CoreIconTokens.clock,
                size: 10,
                color: Color(0xFF0E0E0E),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestCard extends StatelessWidget {
  const _GuestCard({required this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return _RoleCardTapArea(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(20),
      child: CustomPaint(
        painter: _DashedCardBorderPainter(),
        child: Container(
          constraints: const BoxConstraints(minHeight: 136),
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
          child: Column(
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const _GuestEyeBadge(),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Text('Misafir',
                                style: _RoleTextStyles.cardTitle(context)),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Container(
                                height: 24,
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 9),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F2F0),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: <Widget>[
                                    const Icon(
                                      CoreIconTokens.lock,
                                      size: 12,
                                      color: Color(0xFF1B1E1D),
                                    ),
                                    const SizedBox(width: 4),
                                    Flexible(
                                      child: Text(
                                        'Konum izni gerekmez',
                                        overflow: TextOverflow.ellipsis,
                                        style: _RoleTextStyles.chip(context),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text('Sadece izle.',
                            style: _RoleTextStyles.cardDescription(context)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _RoleActionButton(
                label: 'Misafir Olarak Devam Et',
                onPressed: onPressed,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GuestEyeBadge extends StatelessWidget {
  const _GuestEyeBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: <Color>[Color(0xFFA5F1DD), Color(0xFF6FDCC0)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: const Icon(
        CoreIconTokens.eye,
        size: 20,
        color: Color(0xFF0F3D3E),
      ),
    );
  }
}

class _RoleActionButton extends StatelessWidget {
  const _RoleActionButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFF0E0E0E),
            borderRadius: BorderRadius.circular(24),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: Colors.black.withAlpha(36),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Stack(
              alignment: Alignment.center,
              children: <Widget>[
                Center(
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: _RoleTextStyles.cta(context),
                  ),
                ),
                const Align(
                  alignment: Alignment.centerRight,
                  child: Icon(
                    CoreIconTokens.caretRight,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DashedCardBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE2E4E1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    const dashWidth = 6.0;
    const dashGap = 4.0;

    final rect = Rect.fromLTWH(
      0.75,
      0.75,
      size.width - 1.5,
      size.height - 1.5,
    );
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(20));
    final path = Path()..addRRect(rrect);

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final nextDistance = math.min(metric.length, distance + dashWidth);
        canvas.drawPath(metric.extractPath(distance, nextDistance), paint);
        distance += dashWidth + dashGap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _RoleTextStyles {
  const _RoleTextStyles._();

  static TextStyle title(BuildContext context) {
    return TextStyle(
      fontFamily: _displayFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w700,
      fontSize: 28,
      height: 34 / 28,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle subtitle(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w400,
      fontSize: 15,
      height: 22 / 15,
      color: const Color(0xFF6B6F6D),
    );
  }

  static TextStyle logoFallback(BuildContext context) {
    return TextStyle(
      fontFamily: _displayFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Space Grotesk'],
      fontWeight: FontWeight.w700,
      fontSize: 22,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle driverTitle(BuildContext context) {
    return TextStyle(
      fontFamily: _displayFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Space Grotesk'],
      fontWeight: FontWeight.w600,
      fontSize: 18,
      height: 24 / 18,
      color: Colors.white,
    );
  }

  static TextStyle driverDescription(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope'],
      fontWeight: FontWeight.w400,
      fontSize: 15,
      height: 22 / 15,
      color: Colors.white.withAlpha(224),
    );
  }

  static TextStyle cardTitle(BuildContext context) {
    return TextStyle(
      fontFamily: _displayFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Space Grotesk'],
      fontWeight: FontWeight.w600,
      fontSize: 18,
      height: 24 / 18,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle cardDescription(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope'],
      fontWeight: FontWeight.w400,
      fontSize: 15,
      height: 22 / 15,
      color: const Color(0xFF6B6F6D),
    );
  }

  static TextStyle chip(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope'],
      fontWeight: FontWeight.w500,
      fontSize: 13,
      height: 18 / 13,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle cta(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope'],
      fontWeight: FontWeight.w600,
      fontSize: 16,
      height: 20 / 16,
      color: Colors.white,
    );
  }

  static String _displayFamily(BuildContext context) {
    if (Theme.of(context).platform == TargetPlatform.iOS) {
      return 'SF Pro Display';
    }
    return 'Inter';
  }

  static String _textFamily(BuildContext context) {
    if (Theme.of(context).platform == TargetPlatform.iOS) {
      return 'SF Pro Text';
    }
    return 'Inter';
  }
}
