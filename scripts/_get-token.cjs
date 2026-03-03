'use strict';
// firebase-tools'un kendi apiv2 modülü token refresh'i otomatik halleder
const { Client } = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/lib/apiv2');

const PROJECT = 'neredeservis-prod-01';

const btn = (label) =>
  `<a href="%LINK%" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.01em;">${label}</a>`;

const footer = `
<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
<p style="font-size:11px;color:#9ca3af;margin:0;">
  Bu iletiyi siz talep etmediyseniz görmezden gelebilirsiniz — hesabınıza herhangi bir değişiklik yapılmayacaktır.<br>
  <strong>NeredeServis</strong> · Operasyon ve Servis Yönetim Platformu
</p>`;

const wrap = (content) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;color:#111827;">
  <p style="font-size:22px;font-weight:700;margin:0 0 4px 0;color:#111827;">NeredeServis</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0 28px 0;">
  ${content}
  ${footer}
</div>`;

const templates = {
  resetPasswordTemplate: {
    senderDisplayName: 'NeredeServis',
    senderLocalPart: 'noreply',
    replyTo: 'destek@neredeservis.app',
    subject: 'NeredeServis — Hesabınızı Etkinleştirin',
    bodyFormat: 'HTML',
    body: wrap(`
      <p style="font-size:16px;font-weight:600;margin:0 0 12px 0;">Hesabınız oluşturuldu</p>
      <p style="margin:0 0 20px 0;line-height:1.6;color:#374151;">
        NeredeServis platformuna davet edildiniz. Hesabınıza erişmek için aşağıdaki düğmeye tıklayarak şifrenizi belirleyin.
      </p>
      <p style="margin:0 0 28px 0;">${btn('Şifremi Belirle')}</p>
      <p style="font-size:12px;color:#6b7280;margin:0;">
        Düğme çalışmıyor mu? Aşağıdaki bağlantıyı tarayıcınıza kopyalayın:<br>
        <a href="%LINK%" style="color:#2563eb;word-break:break-all;">%LINK%</a>
      </p>`),
  },

  verifyEmailTemplate: {
    senderDisplayName: 'NeredeServis',
    senderLocalPart: 'noreply',
    replyTo: 'destek@neredeservis.app',
    subject: 'NeredeServis — E-posta Adresinizi Doğrulayın',
    bodyFormat: 'HTML',
    body: wrap(`
      <p style="font-size:16px;font-weight:600;margin:0 0 12px 0;">E-posta doğrulama</p>
      <p style="margin:0 0 20px 0;line-height:1.6;color:#374151;">
        Merhaba <strong>%DISPLAY_NAME%</strong>,<br>
        NeredeServis hesabınızla ilişkilendirilen e-posta adresini doğrulamak için aşağıdaki düğmeye tıklayın.
      </p>
      <p style="margin:0 0 28px 0;">${btn('E-postamı Doğrula')}</p>
      <p style="font-size:12px;color:#6b7280;margin:0;">
        Düğme çalışmıyor mu? Aşağıdaki bağlantıyı tarayıcınıza kopyalayın:<br>
        <a href="%LINK%" style="color:#2563eb;word-break:break-all;">%LINK%</a>
      </p>`),
  },

  changeEmailTemplate: {
    senderDisplayName: 'NeredeServis',
    senderLocalPart: 'noreply',
    replyTo: 'destek@neredeservis.app',
    subject: 'NeredeServis — E-posta Adresiniz Değiştirildi',
    bodyFormat: 'HTML',
    body: wrap(`
      <p style="font-size:16px;font-weight:600;margin:0 0 12px 0;">E-posta adresi değişikliği</p>
      <p style="margin:0 0 20px 0;line-height:1.6;color:#374151;">
        NeredeServis hesabınızın e-posta adresi <strong>%NEW_EMAIL%</strong> olarak güncellendi.
        Bu değişikliği siz yapmadıysanız aşağıdaki düğme ile işlemi geri alabilirsiniz.
      </p>
      <p style="margin:0 0 28px 0;">${btn('Değişikliği Geri Al')}</p>
      <p style="font-size:12px;color:#6b7280;margin:0;">
        Düğme çalışmıyor mu? Aşağıdaki bağlantıyı tarayıcınıza kopyalayın:<br>
        <a href="%LINK%" style="color:#2563eb;word-break:break-all;">%LINK%</a>
      </p>`),
  },

  revertSecondFactorAdditionTemplate: {
    senderDisplayName: 'NeredeServis',
    senderLocalPart: 'noreply',
    replyTo: 'destek@neredeservis.app',
    subject: 'NeredeServis — İki Aşamalı Doğrulama Güncellendi',
    bodyFormat: 'HTML',
    body: wrap(`
      <p style="font-size:16px;font-weight:600;margin:0 0 12px 0;">İki aşamalı doğrulama eklendi</p>
      <p style="margin:0 0 20px 0;line-height:1.6;color:#374151;">
        NeredeServis hesabınıza iki aşamalı doğrulama (2FA) yöntemi olarak <strong>%SECOND_FACTOR_INFO%</strong> eklendi.
        Bu işlemi siz yapmadıysanız aşağıdaki düğme ile geri alabilirsiniz.
      </p>
      <p style="margin:0 0 28px 0;">${btn('İşlemi Geri Al')}</p>
      <p style="font-size:12px;color:#6b7280;margin:0;">
        Düğme çalışmıyor mu? Aşağıdaki bağlantıyı tarayıcınıza kopyalayın:<br>
        <a href="%LINK%" style="color:#2563eb;word-break:break-all;">%LINK%</a>
      </p>`),
  },
};

const updateMask = Object.keys(templates)
  .map((k) => `notification.sendEmail.${k}`)
  .join(',');

const payload = { notification: { sendEmail: templates } };

const client = new Client({
  urlPrefix: 'https://identitytoolkit.googleapis.com',
  auth: true,
});

(async () => {
  try {
    console.log('Tum email sablonlari guncelleniyor...');
    const res = await client.request({
      method: 'PATCH',
      path: `/admin/v2/projects/${PROJECT}/config`,
      queryParams: { updateMask },
      body: payload,
      responseType: 'json',
    });
    const se = (res.body.notification || {}).sendEmail || {};
    console.log('\n✅ Guncellendi:');
    Object.keys(templates).forEach((k) => {
      const t = se[k] || {};
      console.log(`  [${k}]  Subject: ${t.subject}  Sender: ${t.senderDisplayName}`);
    });
  } catch (e) {
    console.error('HATA:', e.message || e);
    process.exit(1);
  }
})();
