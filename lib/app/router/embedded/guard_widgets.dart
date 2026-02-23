part of '../app_router.dart';

class _SessionRoleRefreshNotifier extends ChangeNotifier {
  void ping() {
    notifyListeners();
  }
}

class _DoubleBackExitGuard extends StatefulWidget {
  const _DoubleBackExitGuard({
    required this.child,
  });

  final Widget child;

  @override
  State<_DoubleBackExitGuard> createState() => _DoubleBackExitGuardState();
}

class _DoubleBackExitGuardState extends State<_DoubleBackExitGuard> {
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
          _showInfo(
              context, 'Cikmak iÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§in geri tusuna tekrar bas.');
          return;
        }
        SystemNavigator.pop();
      },
      child: widget.child,
    );
  }
}

class _PassengerHomeEntryGuard extends StatefulWidget {
  const _PassengerHomeEntryGuard();

  @override
  State<_PassengerHomeEntryGuard> createState() =>
      _PassengerHomeEntryGuardState();
}

class _PassengerHomeEntryGuardState extends State<_PassengerHomeEntryGuard> {
  bool _redirected = false;

  @override
  void initState() {
    super.initState();
    unawaited(_resolveAndRedirect());
  }

  Future<void> _resolveAndRedirect() async {
    final switchSourceRole = _snapshotRoleSwitchSourceRole();
    final user = FirebaseAuth.instance.currentUser;
    final destination = (user == null || user.isAnonymous)
        ? _buildAuthRouteWithNextRole(_authNextRolePassenger)
        : await _resolvePassengerHomeDestination(user);
    if (!mounted || _redirected) {
      return;
    }
    _redirected = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _applyRoleSwitchNavigationPlan(
        context,
        fromRole: switchSourceRole,
        toRole: UserRole.passenger,
        targetLocation: destination,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator.adaptive(),
      ),
    );
  }
}
