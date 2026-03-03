// Script to delete all company_memberships subcollections under users/{uid}
// Uses firebase-admin with application default credentials
const admin = require('../functions/node_modules/firebase-admin');

admin.initializeApp({
  projectId: 'neredeservis-prod-01',
});

const db = admin.firestore();

async function cleanupMemberships() {
  console.log('Scanning users collection...');
  
  // Walk users collection and delete company_memberships subcollection for each user
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log('No users found.');
    return;
  }

  console.log(`Found ${usersSnapshot.size} users.`);
  let totalDeleted = 0;

  for (const userDoc of usersSnapshot.docs) {
    const membershipSnapshot = await db
      .collection('users')
      .doc(userDoc.id)
      .collection('company_memberships')
      .get();

    if (membershipSnapshot.empty) {
      continue;
    }

    const batch = db.batch();
    for (const doc of membershipSnapshot.docs) {
      batch.delete(doc.ref);
      totalDeleted++;
    }
    await batch.commit();
    console.log(`Deleted ${membershipSnapshot.size} memberships for user ${userDoc.id}`);
  }

  console.log(`Done! Deleted ${totalDeleted} company_memberships documents total.`);
}

cleanupMemberships().catch(console.error);
