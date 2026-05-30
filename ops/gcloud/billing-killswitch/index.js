'use strict';

const {CloudBillingClient} = require('@google-cloud/billing');

const billing = new CloudBillingClient();

const TARGET_PROJECT_ID =
  process.env.TARGET_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const TARGET_PROJECT_NAME = TARGET_PROJECT_ID
  ? `projects/${TARGET_PROJECT_ID}`
  : null;
const EXPECTED_BUDGET_NAME = process.env.EXPECTED_BUDGET_NAME || '';

exports.stopBilling = async pubsubEvent => {
  const rawData = pubsubEvent?.data
    ? Buffer.from(pubsubEvent.data, 'base64').toString('utf8')
    : '{}';

  let budgetUpdate;
  try {
    budgetUpdate = JSON.parse(rawData);
  } catch (error) {
    console.error('Invalid budget payload', {rawData, error});
    return;
  }

  const budgetName = String(budgetUpdate.budgetDisplayName || '');
  const costAmount = Number(budgetUpdate.costAmount || 0);
  const budgetAmount = Number(budgetUpdate.budgetAmount || 0);

  console.log('Received budget update', {
    budgetName,
    costAmount,
    budgetAmount,
    targetProject: TARGET_PROJECT_ID,
  });

  if (!TARGET_PROJECT_NAME) {
    console.error('No target project configured');
    return;
  }

  if (EXPECTED_BUDGET_NAME && budgetName !== EXPECTED_BUDGET_NAME) {
    console.log('Ignoring unrelated budget message', {
      expected: EXPECTED_BUDGET_NAME,
      received: budgetName,
    });
    return;
  }

  if (!(costAmount > budgetAmount)) {
    console.log('Budget threshold not exceeded yet');
    return;
  }

  const [billingInfo] = await billing.getProjectBillingInfo({
    name: TARGET_PROJECT_NAME,
  });

  if (!billingInfo.billingEnabled) {
    console.log('Billing already disabled');
    return;
  }

  const [response] = await billing.updateProjectBillingInfo({
    name: TARGET_PROJECT_NAME,
    resource: {billingAccountName: ''},
  });

  console.error('Billing disabled by kill switch', {
    targetProject: TARGET_PROJECT_ID,
    budgetName,
    costAmount,
    budgetAmount,
    response,
  });
};
