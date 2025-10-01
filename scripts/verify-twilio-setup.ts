#!/usr/bin/env ts-node

/**
 * Twilio Setup Verification Script
 *
 * This script verifies that your Twilio credentials are correctly configured
 * and tests basic Twilio API connectivity.
 */

import { getTwilioClient } from '../src/lib/twilio/client';

async function verifyTwilioSetup() {
  console.log('🔍 Verifying Twilio Setup...\n');

  try {
    // Check environment variables
    console.log('1️⃣  Checking environment variables...');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;

    if (!accountSid) {
      console.error('   ❌ TWILIO_ACCOUNT_SID is not set');
      return false;
    }
    console.log(`   ✅ TWILIO_ACCOUNT_SID: ${accountSid}`);

    if (!authToken) {
      console.error('   ❌ TWILIO_AUTH_TOKEN is not set');
      return false;
    }
    console.log(`   ✅ TWILIO_AUTH_TOKEN: ${authToken.substring(0, 8)}...`);

    if (workspaceSid) {
      console.log(`   ✅ TWILIO_WORKSPACE_SID: ${workspaceSid}`);
    } else {
      console.log('   ⚠️  TWILIO_WORKSPACE_SID not set (optional for basic setup)');
    }

    if (phoneNumber) {
      console.log(`   ✅ TWILIO_PHONE_NUMBER: ${phoneNumber}`);
    } else {
      console.log('   ⚠️  TWILIO_PHONE_NUMBER not set');
    }

    if (publicBaseUrl) {
      console.log(`   ✅ PUBLIC_BASE_URL: ${publicBaseUrl}`);
    } else {
      console.log('   ⚠️  PUBLIC_BASE_URL not set (needed for webhooks)');
    }

    // Test Twilio client initialization
    console.log('\n2️⃣  Testing Twilio client initialization...');
    const client = getTwilioClient();
    console.log('   ✅ Twilio client initialized successfully');

    // Test API connectivity by fetching account info
    console.log('\n3️⃣  Testing Twilio API connectivity...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`   ✅ Connected to Twilio API`);
    console.log(`   Account Status: ${account.status}`);
    console.log(`   Account Type: ${account.type}`);

    // List incoming phone numbers
    console.log('\n4️⃣  Checking Twilio phone numbers...');
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({ limit: 10 });

    if (incomingPhoneNumbers.length === 0) {
      console.log('   ⚠️  No phone numbers found in Twilio account');
      console.log('   You need to purchase a phone number from Twilio Console');
    } else {
      console.log(`   ✅ Found ${incomingPhoneNumbers.length} phone number(s):`);
      incomingPhoneNumbers.forEach((number) => {
        console.log(`      • ${number.phoneNumber} (${number.friendlyName})`);
        console.log(`        Voice URL: ${number.voiceUrl || 'Not configured'}`);
        console.log(`        SMS URL: ${number.smsUrl || 'Not configured'}`);
      });
    }

    // Check TaskRouter workspace if configured
    if (workspaceSid) {
      console.log('\n5️⃣  Checking TaskRouter workspace...');
      try {
        const workspace = await client.taskrouter.v1.workspaces(workspaceSid).fetch();
        console.log(`   ✅ TaskRouter Workspace: ${workspace.friendlyName}`);
        console.log(`   Workspace Status: ${workspace.eventCallbackUrl ? 'Configured' : 'Not fully configured'}`);
      } catch (error: any) {
        console.error(`   ❌ Error fetching TaskRouter workspace: ${error.message}`);
      }
    }

    console.log('\n✅ Twilio setup verification completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Update TWILIO_PHONE_NUMBER in .env with one of your numbers');
    console.log('   2. Configure webhook URLs in Twilio Console');
    console.log('   3. See TWILIO_SETUP.md for detailed webhook configuration');

    return true;
  } catch (error: any) {
    console.error('\n❌ Twilio setup verification failed!');
    console.error(`Error: ${error.message}`);

    if (error.code === 20003) {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   - TWILIO_ACCOUNT_SID is correct');
      console.error('   - TWILIO_AUTH_TOKEN is correct');
      console.error('   - Credentials are not expired');
    }

    return false;
  }
}

// Run the verification
if (require.main === module) {
  verifyTwilioSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { verifyTwilioSetup };