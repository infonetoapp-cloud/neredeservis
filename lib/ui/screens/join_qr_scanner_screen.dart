import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class JoinQrScannerScreen extends StatefulWidget {
  const JoinQrScannerScreen({
    super.key,
    required this.onCodeDetected,
    this.onBackTap,
    this.onManualCodeTap,
  });

  final Future<void> Function(String rawValue) onCodeDetected;
  final VoidCallback? onBackTap;
  final VoidCallback? onManualCodeTap;

  @override
  State<JoinQrScannerScreen> createState() => _JoinQrScannerScreenState();
}

class _JoinQrScannerScreenState extends State<JoinQrScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    formats: const [BarcodeFormat.qrCode],
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _processing = false;
  bool _torchEnabled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _toggleTorch() async {
    try {
      await _controller.toggleTorch();
      if (!mounted) {
        return;
      }
      setState(() {
        _torchEnabled = !_torchEnabled;
      });
    } catch (_) {
      // Torch is best-effort only.
    }
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing) {
      return;
    }
    final rawValue = capture.barcodes
        .map((barcode) => barcode.rawValue?.trim())
        .whereType<String>()
        .firstWhere(
          (value) => value.isNotEmpty,
          orElse: () => '',
        );
    if (rawValue.isEmpty) {
      return;
    }

    setState(() {
      _processing = true;
    });
    try {
      await widget.onCodeDetected(rawValue);
    } finally {
      if (mounted) {
        setState(() {
          _processing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: <Widget>[
          Positioned.fill(
            child: MobileScanner(
              controller: _controller,
              fit: BoxFit.cover,
              onDetect: _onDetect,
            ),
          ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: <Color>[
                    Colors.black.withOpacity(0.72),
                    Colors.black.withOpacity(0.56),
                    Colors.black.withOpacity(0.82),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  const SizedBox(height: 8),
                  Row(
                    children: <Widget>[
                      _CircleIconButton(
                        icon: Icons.arrow_back_rounded,
                        onTap: widget.onBackTap,
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Text(
                          'QR Kodu Tara',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 34,
                            fontWeight: FontWeight.w700,
                            height: 1.05,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'uutfen servis aracindaki veya duraktaki QR kodu cerceve icine hizalayin.',
                    style: TextStyle(
                      color: Color(0xFFE8E8E8),
                      fontSize: 18,
                      height: 1.3,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(flex: 2),
                  const Center(
                    child: _ScannerFrame(),
                  ),
                  const Spacer(flex: 3),
                  Center(
                    child: GestureDetector(
                      onTap: _toggleTorch,
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        children: <Widget>[
                          Container(
                            width: 74,
                            height: 74,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.12),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.35),
                                width: 1.2,
                              ),
                            ),
                            child: Icon(
                              _torchEnabled
                                  ? Icons.flashlight_off_rounded
                                  : Icons.flashlight_on_rounded,
                              color: Colors.white,
                              size: 31,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _torchEnabled ? 'FENERI KAPAT' : 'FENERI AC',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  TextButton.icon(
                    onPressed: widget.onManualCodeTap,
                    icon: const Icon(
                      Icons.keyboard_alt_outlined,
                      color: Color(0xFFFFFFFF),
                    ),
                    label: const Text(
                      'Kodu El Ile Gir',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        height: 1.05,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
          if (_processing)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.35),
                alignment: Alignment.center,
                child: const CircularProgressIndicator(
                  color: Color(0xFFFFFFFF),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({
    required this.icon,
    this.onTap,
  });

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      radius: 28,
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withOpacity(0.15),
          border: Border.all(
            color: Colors.white.withOpacity(0.18),
          ),
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}

class _ScannerFrame extends StatelessWidget {
  const _ScannerFrame();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 280,
      height: 280,
      child: Stack(
        children: <Widget>[
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: Colors.white.withOpacity(0.24),
                  width: 1.2,
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: Container(
              margin: const EdgeInsets.symmetric(
                horizontal: 26,
                vertical: 138,
              ),
              height: 2,
              color: const Color(0xFFFFFFFF),
            ),
          ),
          const Positioned(top: 0, left: 0, child: _CornerMark()),
          const Positioned(top: 0, right: 0, child: _CornerMark(right: true)),
          const Positioned(
            bottom: 0,
            left: 0,
            child: _CornerMark(bottom: true),
          ),
          const Positioned(
            bottom: 0,
            right: 0,
            child: _CornerMark(right: true, bottom: true),
          ),
        ],
      ),
    );
  }
}

class _CornerMark extends StatelessWidget {
  const _CornerMark({
    this.right = false,
    this.bottom = false,
  });

  final bool right;
  final bool bottom;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 42,
      height: 42,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(!right && !bottom ? 14 : 0),
            topRight: Radius.circular(right && !bottom ? 14 : 0),
            bottomLeft: Radius.circular(!right && bottom ? 14 : 0),
            bottomRight: Radius.circular(right && bottom ? 14 : 0),
          ),
          border: Border(
            top: BorderSide(
              color: const Color(0xFFFFFFFF),
              width: bottom ? 0 : 4,
            ),
            bottom: BorderSide(
              color: const Color(0xFFFFFFFF),
              width: bottom ? 4 : 0,
            ),
            left: BorderSide(
              color: const Color(0xFFFFFFFF),
              width: right ? 0 : 4,
            ),
            right: BorderSide(
              color: const Color(0xFFFFFFFF),
              width: right ? 4 : 0,
            ),
          ),
        ),
      ),
    );
  }
}
