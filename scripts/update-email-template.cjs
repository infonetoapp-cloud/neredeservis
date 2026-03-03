const auth = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth');
const acct = auth.getGlobalDefaultAccount();
const token = acct.tokens.access_token;
const PROJECT = 'neredeservis-prod-01';
const APP_BASE_URL = 'https://app.neredeservis.app';

const emailBody = [
  '<p>Merhaba,</p>',
  '<p>NeredeServis platformuna eklendiniz. Hesabiniz icin bir sifre belirlemek uzere asagidaki butona tiklayin:</p>',
  '<p>',
  '<a href="%LINK%" style="background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:14px;">',
  'Sifremi Belirle</a>',
  '</p>',
  '<p style="font-size:12px;color:#666;margin-top:16px;">',
  'Yukaridaki buton calismiyor mu? Bu baglantiya tiklayin:<br>',
  '<a href="%LINK%">%LINK%</a>',
  '</p>',
  '<p>Bu istegi siz yapmadıysanız bu e-postayı gormezden gelebilirsiniz.</p>',
  '<p>Tesekkurler,<br><strong>NeredeServis Ekibi</strong></p>',
].join('\n');

const body = {
  notification: {
    sendEmail: {
      resetPasswordTemplate: {
        senderLocalPart: 'noreply',
        senderDisplayName: 'NeredeServis',
        subject: 'NeredeServis - Hesabinizi Aktif Edin',
        body: emailBody,
        bodyFormat: 'HTML',
        replyTo: 'destek@neredeservis.app',
      },
    },
  },
};

const url =
  'https://identitytoolkit.googleapis.com/admin/v2/projects/' +
  PROJECT +
  '/config?updateMask=notification.sendEmail.resetPasswordTemplate';

console.log('Firebase email template guncelleniyor...');

fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})
  .then((r) => r.json())
  .then((d) => {
    if (d.error) {
      console.error('HATA:', JSON.stringify(d.error, null, 2));
      process.exit(1);
    }
    const t = ((d.notification || {}).sendEmail || {}).resetPasswordTemplate || {};
    console.log('✅ Email template guncellendi!');
    console.log('  Subject:', t.subject);
    console.log('  Sender:', t.senderDisplayName);

    // Custom action URL'yi de guncelle (linkin /set-password sayfasina gitmesi icin)
    const urlAction =
      'https://identitytoolkit.googleapis.com/admin/v2/projects/' +
      PROJECT +
      '/config?updateMask=client.permissions';

    // Bu alinmaz, bunun yerine continueUrl zaten backend'de set-password URL'si olarak
    // generatePasswordResetLink cagrisinda pass edilmis. Email template body'si yeterli.
    console.log('✅ Tamamlandi. Firebase Console > Authentication > Templates > Password reset >');
    console.log('   "Customize action URL" → ' + APP_BASE_URL + '/set-password');
    console.log('   adresini manuel olarak gir (sadece bir kez gerekli).');
  })
  .catch((e) => {
    console.error('HATA:', e.message);
    process.exit(1);
  });
