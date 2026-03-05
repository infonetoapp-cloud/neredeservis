/**
 * Tum Firebase Auth email sablonlarini Turkce kurumsal dile cevirir.
 * node scripts/update-all-email-templates.cjs
 */
'use strict';
const auth = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth');
const api = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/lib/api');
const https = require('https');
const PROJECT = 'neredeservis-prod-01';
const CLIENT_ID = process.env.FIREBASE_CLIENT_ID || api.clientId();
const CLIENT_SECRET = process.env.FIREBASE_CLIENT_SECRET || api.clientSecret();

function postForm(url, data) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(data).toString();
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
      (res) => { let s = ''; res.on('data', (c) => (s += c)); res.on('end', () => resolve(JSON.parse(s))); },
    );
    req.on('error', reject); req.write(body); req.end();
  });
}

function patchJson(url, token, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } },
      (res) => { let s = ''; res.on('data', (c) => (s += c)); res.on('end', () => resolve(JSON.parse(s))); },
    );
    req.on('error', reject); req.write(bodyStr); req.end();
  });
}

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
        NeredeServis platformuna davet edildiniz. Hesabınıza erişmek için aşağıdaki düğmeye tıklayarak bir şifre belirleyin.
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

const updateMask = Object.keys(templates).map((k) => `notification.sendEmail.${k}`).join(',');

(async () => {
  // 1. Access token yenile
  const acct = auth.getGlobalDefaultAccount();
  if (!acct || !acct.tokens || !acct.tokens.refresh_token) {
    console.error('refresh_token bulunamadi — once: firebase login'); process.exit(1);
  }
  console.log('Token yenileniyor...');
  const tokenResp = await postForm('https://www.googleapis.com/oauth2/v3/token', {
    client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    refresh_token: acct.tokens.refresh_token, grant_type: 'refresh_token',
  });
  if (!tokenResp.access_token) {
    console.error('Token alinamadi:', JSON.stringify(tokenResp)); process.exit(1);
  }
  console.log('✓ Token alindi\n');

  // 2. Template guncelle
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config?updateMask=${updateMask}`;
  const d = await patchJson(url, tokenResp.access_token, { notification: { sendEmail: templates } });
  if (d.error) {
    console.error('API HATA:', JSON.stringify(d.error, null, 2)); process.exit(1);
  }
  const se = (d.notification || {}).sendEmail || {};
  console.log('✅ Tum sablonlar guncellendi:');
  Object.keys(templates).forEach((k) => {
    const t = se[k] || {};
    const bodySnippet = (t.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 80);
    console.log(`\n  [${k}]`);
    console.log(`    Subject: ${t.subject || '?'}`);
    console.log(`    Sender:  ${t.senderDisplayName || '?'}`);
    console.log(`    Body:    ${bodySnippet || '(bos)'}...`);
  });
})();
