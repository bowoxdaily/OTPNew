#!/usr/bin/env node
/**
 * Markup Setup Script
 * Initialize default markup settings
 */

require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function setupDefaultMarkups() {
  console.log('🚀 Setting up default markup configurations...\n');

  try {
    // 1. Create GLOBAL markup (15% + Rp 1.000)
    console.log('📝 Creating GLOBAL markup (15% + Rp 1.000)...');
    const { data: globalMarkup, error: globalError } = await supabase
      .from('markup_settings')
      .upsert({
        service_id: null,
        service_name: 'GLOBAL',
        markup_percentage: 15,
        markup_fixed: 1000,
        is_active: true,
      }, {
        onConflict: 'service_id',
      })
      .select();

    if (globalError) throw globalError;
    console.log('✅ Global markup created:', globalMarkup[0]);
    console.log('   Formula: provider_price × 1.15 + 1000\n');

    // 2. Create Shopee specific markup (20% + Rp 2.000)
    console.log('📝 Creating Shopee markup (20% + Rp 2.000)...');
    const { data: shopeeMarkup, error: shopeeError } = await supabase
      .from('markup_settings')
      .insert({
        service_id: '9985',
        service_name: 'Shopee',
        markup_percentage: 20,
        markup_fixed: 2000,
        is_active: true,
      })
      .select();

    if (shopeeError && !shopeeError.message.includes('unique')) throw shopeeError;
    console.log('✅ Shopee markup created');
    console.log('   Formula: provider_price × 1.20 + 2000\n');

    // 3. Get all markups to verify
    console.log('📊 Verifying all markups...');
    const { data: allMarkups, error: allError } = await supabase
      .from('markup_settings')
      .select('*')
      .order('service_name', { ascending: true });

    if (allError) throw allError;

    console.log('\n📋 Current Markup Configuration:');
    console.log('─'.repeat(60));
    allMarkups.forEach((markup, idx) => {
      const example = 10000 * (markup.markup_percentage / 100) + markup.markup_fixed;
      console.log(`\n${idx + 1}. ${markup.service_name || 'GLOBAL'}`);
      console.log(`   ID: ${markup.service_id || 'null'}`);
      console.log(`   Persentase: ${markup.markup_percentage}%`);
      console.log(`   Fixed: Rp ${markup.markup_fixed.toLocaleString('id-ID')}`);
      console.log(`   Status: ${markup.is_active ? '🟢 Aktif' : '🔴 Nonaktif'}`);
      console.log(`   Contoh: Rp 10.000 → Rp ${(10000 + example).toLocaleString('id-ID')}`);
    });
    console.log('\n' + '─'.repeat(60));

    console.log('\n✨ Setup berhasil!\n');
    console.log('💡 Tips:');
    console.log('   - Gunakan admin UI untuk manage markup');
    console.log('   - Global markup berlaku untuk service tanpa rule khusus');
    console.log('   - Setiap order akan otomatis calculate harga dengan markup');
    console.log('   - Profit = markup_amount dari setiap order');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDefaultMarkups().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
});
