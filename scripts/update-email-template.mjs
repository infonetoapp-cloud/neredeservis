/**
 * Firebase Authentication email template güncelleme scripti.
 * Çalıştırma: node scripts/update-email-template.mjs
 *
 * Gereksinim: firebase-admin paketinin yüklü olması veya APPLICATION DEFAULT CREDENTIALS.
 * Firebase CLI'ın giriş yapmış olması yeterli.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// functions/node_modules'dan al
process.chdir(new URL('../functions', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const { GoogleAuth } = require('./node_modules/google-auth-library/build/src/index.js');

const PROJECT_ID = 'neredeservis-prod-01';
const APP_BASE_URL = 'https://app.neredeservis.app';

// Application Default Credentials kullan (firebase CLI'ın login'i çalışıyor)
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const client = await auth.getClient();
const tokenResult = await client.getAccessToken();
const accessToken = tokenResult.token;

if (!accessToken) {
  console.error('Access token alınamadı. firebase CLI ile giriş yapın: firebase login');
  process.exit(1);
}

const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;

const body = {
  emailPrivacyConfig: {
    enableImprovedEmailPrivacy: false,
  },
  actionCodeSettings: {
    handlerUri: `${APP_BASE_URL}/set-password`,
  },
  notification: {
    sendEmail: {
      method: 'DEFAULT',
      resetPasswordTemplate: {
        senderDisplayName: 'NeredeServis',
        subject: 'NeredeServis - Hesabınızı Etkinleştirin',
        body: `<p>Merhaba,</p>
<p>NeredeServis platformuna eklendiniz. Hesabınız için bir şifre belirlemek üzere aşağıdaki bağlantıya tıklayın:</p>
<p><a href="%LINK%" style="background-color:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Şifremi Belirle</a></p>
<p>Ya da bu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</p>
<p>%LINK%</p>
<p>Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
<p>Teşekkürler,<br>NeredeServis Ekibi</p>`,
        bodyFormat: 'HTML',
        replyTo: 'destek@neredeservis.app',
      },
    },
  },
};

console.log('Firebase email template güncelleniyor...');

const resp = await fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const result = await resp.json();

if (!resp.ok) {
  console.error('HATA:', resp.status, JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log('✅ Email template başarıyla güncellendi.');
console.log('Custom action URL:', `${APP_BASE_URL}/set-password`);
