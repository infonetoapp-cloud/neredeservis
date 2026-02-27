import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemNavigator;

typedef RouterBackBlockedHandler = void Function(BuildContext context);
typedef RouterTargetLocationResolver = Future<String> Function();
typedef RouterTargetNavigationApplier = void Function(
  BuildContext context,
  String targetLocation,
);

class RouterDoubleBackExitGuard extends StatefulWidget {
  const RouterDoubleBackExitGuard({
    super.key,
    required this.child,
    required this.onBackBlocked,
  });

  final Widget child;
  final RouterBackBlockedHandler onBackBlocked;

  @override
  State<RouterDoubleBackExitGuard> createState() =>
      _RouterDoubleBackExitGuardState();
}

class _RouterDoubleBackExitGuardState extends State<RouterDoubleBackExitGuard> {
  DateTime? _lastBackAttemptAt;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) {
          return;
        }
        final now = DateTime.now();
        final lastAttempt = _lastBackAttemptAt;
        if (lastAttempt == null ||
            now.difference(lastAttempt) > const Duration(seconds: 2)) {
          _lastBackAttemptAt = now;
          widget.onBackBlocked(context);
          return;
        }
        SystemNavigator.pop();
      },
      child: widget.child,
    );
  }
}

class RouterPassengerHomeEntryGuard extends StatefulWidget {
  const RouterPassengerHomeEntryGuard({
    super.key,
    required this.resolveTargetLocation,
    required this.applyNavigation,
  });

  final RouterTargetLocationResolver resolveTargetLocation;
  final RouterTargetNavigationApplier applyNavigation;

  @override
  State<RouterPassengerHomeEntryGuard> createState() =>
      _RouterPassengerHomeEntryGuardState();
}

class _RouterPassengerHomeEntryGuardState
    extends State<RouterPassengerHomeEntryGuard> {
  static const Duration _resolveTimeout = Duration(seconds: 8);
  bool _redirected = false;
  int _resolveAttempt = 0;
  bool _resolving = true;
  String? _resolveError;

  @override
  void initState() {
    super.initState();
    unawaited(_resolveAndRedirect());
  }

  Future<void> _resolveAndRedirect() async {
    final attemptId = ++_resolveAttempt;
    if (mounted) {
      setState(() {
        _resolving = true;
        _resolveError = null;
      });
    }
    try {
      final destination = await widget.resolveTargetLocation().timeout(
            _resolveTimeout,
          );
      if (!mounted || _redirected || attemptId != _resolveAttempt) {
        return;
      }
      _redirected = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) {
          return;
        }
        widget.applyNavigation(context, destination);
      });
    } on TimeoutException {
      if (!mounted || _redirected || attemptId != _resolveAttempt) {
        return;
      }
      setState(() {
        _resolving = false;
        _resolveError =
            'Yolcu ana sayfası yönlendirmesi zaman aşımına uğradı. İnterneti kontrol edip tekrar deneyin.';
      });
    } catch (error) {
      debugPrint('Passenger home entry redirect failed: $error');
      if (!mounted || _redirected || attemptId != _resolveAttempt) {
        return;
      }
      setState(() {
        _resolving = false;
        _resolveError = 'Yolcu ana sayfası açılamadı. Lütfen tekrar deneyin.';
      });
    }
  }

  void _retryResolve() {
    if (_redirected || _resolving) {
      return;
    }
    unawaited(_resolveAndRedirect());
  }

  @override
  Widget build(BuildContext context) {
    if (_resolveError != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                const Icon(Icons.error_outline, size: 28),
                const SizedBox(height: 12),
                Text(_resolveError!, textAlign: TextAlign.center),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: _retryResolve,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Tekrar Dene'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator.adaptive(),
      ),
    );
  }
}
