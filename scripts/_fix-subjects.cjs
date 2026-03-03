'use strict';
const auth = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth');
const https = require('https');

const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT = 'neredeservis-prod-01';

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

(async () => {
  const acct = auth.getGlobalDefaultAccount();
  const tokenResp = await postForm('https://www.googleapis.com/oauth2/v3/token', {
    client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    refresh_token: acct.tokens.refresh_token, grant_type: 'refresh_token',
  });
  if (!tokenResp.access_token) { console.error('Token alinamadi:', JSON.stringify(tokenResp)); process.exit(1); }
  console.log('Token alindi');

  const payload = {
    notification: {
      sendEmail: {
        verifyEmailTemplate: { subject: 'NeredeServis \u2014 E-posta Adresinizi Do\u011frulay\u0131n', senderDisplayName: 'NeredeServis', replyTo: 'destek@neredeservis.app' },
        changeEmailTemplate: { subject: 'NeredeServis \u2014 E-posta Adresiniz De\u011fi\u015ftirildi', senderDisplayName: 'NeredeServis', replyTo: 'destek@neredeservis.app' },
        revertSecondFactorAdditionTemplate: { subject: 'NeredeServis \u2014 \u0130ki A\u015famal\u0131 Do\u011frulama G\u00fcncellendi', senderDisplayName: 'NeredeServis', replyTo: 'destek@neredeservis.app' },
      },
    },
  };
  const mask = 'notification.sendEmail.verifyEmailTemplate,notification.sendEmail.changeEmailTemplate,notification.sendEmail.revertSecondFactorAdditionTemplate';
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config?updateMask=${mask}`;
  const d = await patchJson(url, tokenResp.access_token, payload);
  if (d.error) { console.error('API HATA:', JSON.stringify(d.error)); process.exit(1); }
  const se = ((d.notification || {}).sendEmail || {});
  ['verifyEmailTemplate', 'changeEmailTemplate', 'revertSecondFactorAdditionTemplate'].forEach((k) => {
    console.log(k, '-> subject:', (se[k] || {}).subject || '?');
  });
  console.log('\nSubject alanlar guncellendi.');
  console.log('NOT: Body alanlarini Firebase Console\'dan manuel guncelleyin.');
})();
