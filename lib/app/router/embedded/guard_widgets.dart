part of '../app_router.dart';

class _SessionRoleRefreshNotifier extends ChangeNotifier {
  void ping() {
    notifyListeners();
  }
}

void _showDoubleBackExitHint(BuildContext context) {
  _showInfo(context, 'Cikmak icin geri tusuna tekrar bas.');
}
