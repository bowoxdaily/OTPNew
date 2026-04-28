const { supabase } = require('../services/supabaseClient');
const path = require('path');
const fs = require('fs');

// In-memory branding cache as fallback
let brandingCache = {
  id: 1,
  brand_name: 'OTP Reseller',
  brand_tagline: 'Platform Jual OTP Reseller',
  primary_color: '#1976d2',
  secondary_color: '#dc004e',
  company_email: 'support@otpreseller.com',
  company_phone: '+62-xxx-xxx-xxxx',
  company_address: 'Jakarta, Indonesia',
  logo_url: null,
  favicon_url: null,
};

/**
 * SECURITY: Validate file magic bytes (not just mimetype which can be spoofed)
 */
function validateFileMagicBytes(fileBuffer) {
  if (!fileBuffer || fileBuffer.length < 4) return false;

  const header = fileBuffer.slice(0, 8);

  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }

  // ICO: 00 00 01 00
  if (header[0] === 0x00 && header[1] === 0x00 && header[2] === 0x01 && header[3] === 0x00) {
    return 'image/x-icon';
  }

  return false;
}

/**
 * SECURITY: Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename) {
  return String(filename || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe chars
    .replace(/\.{2,}/g, '.') // No double dots
    .slice(0, 100); // Limit length
}

/**
 * Get branding settings
 */
async function getBrandingSettings(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('branding_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase error in getBrandingSettings:', error);
      return res.json({ success: true, data: brandingCache });
    }

    if (data) {
      brandingCache = data;
      return res.json({ success: true, data });
    }

    return res.json({ success: true, data: brandingCache });
  } catch (error) {
    console.error('Error in getBrandingSettings:', error.message);
    return res.json({ success: true, data: brandingCache });
  }
}

/**
 * Update branding settings
 */
async function updateBrandingSettings(req, res, next) {
  try {
    const {
      brand_name,
      brand_tagline,
      primary_color,
      secondary_color,
      company_email,
      company_phone,
      company_address,
      logo_url,
      favicon_url,
    } = req.body;

    // SECURITY: Validate color format
    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    if (primary_color && !colorRegex.test(primary_color)) {
      return res.status(400).json({ success: false, message: 'Format primary_color tidak valid (contoh: #1976d2)' });
    }
    if (secondary_color && !colorRegex.test(secondary_color)) {
      return res.status(400).json({ success: false, message: 'Format secondary_color tidak valid' });
    }

    // SECURITY: Validate email format
    if (company_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company_email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }

    // SECURITY: Limit string lengths
    if (brand_name && brand_name.length > 100) {
      return res.status(400).json({ success: false, message: 'Nama brand maksimal 100 karakter' });
    }
    if (brand_tagline && brand_tagline.length > 200) {
      return res.status(400).json({ success: false, message: 'Tagline maksimal 200 karakter' });
    }

    const updateData = {
      id: 1,
      brand_name: brand_name || brandingCache.brand_name,
      brand_tagline: brand_tagline || brandingCache.brand_tagline,
      primary_color: primary_color || brandingCache.primary_color,
      secondary_color: secondary_color || brandingCache.secondary_color,
      company_email: company_email || brandingCache.company_email,
      company_phone: company_phone || brandingCache.company_phone,
      company_address: company_address || brandingCache.company_address,
      logo_url: logo_url !== undefined ? logo_url : brandingCache.logo_url,
      favicon_url: favicon_url !== undefined ? favicon_url : brandingCache.favicon_url,
      updated_at: new Date().toISOString(),
    };

    // Try to update in Supabase
    const { data, error } = await supabase
      .from('branding_settings')
      .upsert([updateData], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase error in updateBrandingSettings:', error);
      // Update cache anyway
      brandingCache = updateData;
      return res.json({ success: true, data: updateData, message: 'Branding updated (cached)' });
    }

    brandingCache = data;
    return res.json({ success: true, data, message: 'Branding settings berhasil diperbarui' });
  } catch (error) {
    console.error('Error in updateBrandingSettings:', error.message);
    res.status(500).json({ success: false, message: 'Gagal memperbarui branding settings' });
  }
}

/**
 * Upload branding file (logo or favicon) to Supabase Storage
 */
async function uploadBrandingFile(req, res, next) {
  try {
    const file = req.files?.file;
    const type = req.body.type; // 'logo' or 'favicon'

    if (!file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    if (!['logo', 'favicon'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipe file tidak valid' });
    }

    // SECURITY: Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File terlalu besar. Maksimal 2MB' });
    }

    // SECURITY: Validate magic bytes (not just mimetype which can be spoofed)
    const detectedType = validateFileMagicBytes(file.data);
    if (!detectedType) {
      return res.status(400).json({ success: false, message: 'File bukan gambar yang valid (PNG, JPG, atau ICO)' });
    }

    // Ensure the 'branding' bucket exists (public so images can be loaded by browser)
    const BUCKET = 'branding';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET);
    if (!bucketExists) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/x-icon'],
      });
      if (createErr) {
        console.error('Failed to create storage bucket:', createErr.message);
        return res.status(500).json({ success: false, message: 'Gagal membuat storage bucket' });
      }
      console.log(`[Branding] Created Supabase Storage bucket: ${BUCKET}`);
    }

    // Generate safe filename
    const timestamp = Date.now();
    const ext = detectedType === 'image/png' ? 'png' : detectedType === 'image/jpeg' ? 'jpg' : 'ico';
    const filename = `${type}-${timestamp}.${ext}`;
    const storagePath = `${filename}`;

    // Upload to Supabase Storage (upsert to overwrite if same name)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.data, {
        contentType: detectedType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError.message);
      return res.status(500).json({ success: false, message: 'Gagal upload file ke storage' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;
    console.log(`[Branding] Uploaded ${type}: ${fileUrl}`);

    // Update branding in database
    const updateData = {
      [`${type}_url`]: fileUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('branding_settings')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      const insertPayload = {
        ...brandingCache,
        id: 1,
        ...updateData,
      };

      const { error: insertError } = await supabase
        .from('branding_settings')
        .upsert([insertPayload], { onConflict: 'id' });

      if (insertError) {
        console.warn('Supabase DB error:', insertError.message);
      }
    }

    brandingCache = { ...brandingCache, ...updateData };

    return res.json({
      success: true,
      data: { url: fileUrl },
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} berhasil diupload`,
    });
  } catch (error) {
    console.error('Error in uploadBrandingFile:', error.message);
    res.status(500).json({ success: false, message: 'Gagal upload file' });
  }
}

module.exports = {
  getBrandingSettings,
  updateBrandingSettings,
  uploadBrandingFile,
};
