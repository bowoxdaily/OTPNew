#!/usr/bin/env node
/**
 * Test script untuk VirtuSIM API Integration
 * Run: node test-virtusim.js
 */

require('dotenv').config();
const {
  checkBalance,
  getCountries,
  getOperatorsByCountry,
  getLayananByCountry,
} = require('./src/services/providerService');

async function runTests() {
  console.log('🚀 Starting VirtuSIM API Tests...\n');

  try {
    // Test 1: Check Balance
    console.log('📊 Test 1: Check Balance');
    try {
      const balance = await checkBalance();
      console.log('✅ Balance:', JSON.stringify(balance, null, 2));
    } catch (err) {
      console.error('❌ Balance Error:', err.message);
    }
    console.log('\n---\n');

    // Test 2: Get Countries
    console.log('🌍 Test 2: Get Countries');
    try {
      const countries = await getCountries();
      console.log(`✅ Found ${countries.length} countries:`);
      console.log(JSON.stringify(countries.slice(0, 3), null, 2));
    } catch (err) {
      console.error('❌ Countries Error:', err.message);
    }
    console.log('\n---\n');

    // Test 3: Get Operators for First Country
    console.log('👤 Test 3: Get Operators (Russia/ID:1)');
    try {
      const operators = await getOperatorsByCountry('Russia');
      console.log(`✅ Found ${operators.length} operators:`, operators.slice(0, 5));
    } catch (err) {
      console.error('❌ Operators Error:', err.message);
    }
    console.log('\n---\n');

    // Test 4: Get Services for Country
    console.log('🎯 Test 4: Get Services (Russia)');
    try {
      const services = await getLayananByCountry('Russia');
      console.log(`✅ Found ${services.length} services:`);
      console.log(JSON.stringify(services.slice(0, 3), null, 2));
    } catch (err) {
      console.error('❌ Services Error:', err.message);
    }

    console.log('\n✨ Tests Complete!');
  } catch (error) {
    console.error('💥 Fatal Error:', error);
  }
}

runTests();
