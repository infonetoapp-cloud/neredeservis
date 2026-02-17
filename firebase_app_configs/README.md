# Firebase Config Policy

Bu klasor yerel Firebase uygulama config dosyalari icindir.

Git'e alinmaz:
- `google-services.json`
- `GoogleService-Info.plist`

Neden:
- Ortam bazli Firebase app kimlikleri ve API anahtarlari bu dosyalarda bulunur.
- Yanlislikla public repoya cikmasini engellemek icin `.gitignore` ile blokludur.

Yeni bir makinede kurulum:
1. Firebase Console veya CLI ile ilgili ortam config dosyalarini indir.
2. `firebase_app_configs/<env>/` altina yerlestir.
3. Android flavor dizinlerine ve iOS dizinlerine kopyala.
