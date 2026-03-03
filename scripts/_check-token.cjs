const auth = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth');
const acct = auth.getGlobalDefaultAccount();
if (!acct) { console.log('NO_ACCOUNT'); process.exit(1); }
console.log('EMAIL:', acct.user.email);
console.log('KEYS:', JSON.stringify(Object.keys(acct.tokens)));
// Try refresh
const client = require('C:/Users/sinan/AppData/Roaming/npm/node_modules/firebase-tools/node_modules/@google-cloud/functions-framework/../../../google-auth-library/build/src/index.js');
