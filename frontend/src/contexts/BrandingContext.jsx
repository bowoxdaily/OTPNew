import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';
import typography from 'src/theme/Typography';
import { shadows } from 'src/theme/Shadows';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

/**
 * Resolve relative asset URLs (e.g. /uploads/branding/logo.png) to the full
 * backend URL so they load correctly in production where frontend and backend
 * are on different domains.
 */
function resolveAssetUrl(url) {
  if (!url) return url;
  // Already absolute — leave as-is
  if (/^https?:\/\//i.test(url)) return url;
  // Relative path — prefix with API base URL
  if (API_BASE_URL) return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  return url;
}

const defaultBranding = {
  brand_name: 'OTP Reseller',
  brand_tagline: 'Platform Reseller OTP Terpercaya',
  primary_color: '#5D87FF',
  secondary_color: '#49BEFF',
  company_email: 'support@otpreseller.com',
  company_phone: '+62-xxx-xxx-xxxx',
  company_address: 'Jakarta, Indonesia',
  logo_url: null,
  favicon_url: null,
};

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async (retryCount = 0) => {
    try {
      const response = await apiFetch('/api/admin/branding');

      // Handle rate limiting silently — just use defaults
      if (response.status === 429) {
        console.warn('[Branding] Rate limited, using cached/default branding');
        return;
      }

      const data = await readJsonSafe(response);
      if (data?.success && data?.data) {
        // Resolve relative asset URLs to full backend URL
        const resolved = { ...data.data };
        if (resolved.logo_url) resolved.logo_url = resolveAssetUrl(resolved.logo_url);
        if (resolved.favicon_url) resolved.favicon_url = resolveAssetUrl(resolved.favicon_url);

        setBranding((prev) => ({ ...prev, ...resolved }));
        if (resolved.favicon_url) {
          updateFavicon(resolved.favicon_url);
        }
        if (data.data.brand_name) {
          document.title = data.data.brand_name;
        }
      }
    } catch (error) {
      // Network error — retry once after 2s
      if (retryCount < 1) {
        setTimeout(() => fetchBranding(retryCount + 1), 2000);
        return;
      }
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const updateFavicon = (url) => {
    if (!url) return;

    // Remove all existing favicon links to ensure only branding favicon is used
    const existingIcons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']");
    existingIcons.forEach(link => link.remove());

    // Create new favicon links with branding URL
    const iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/png';
    iconLink.href = url;
    document.head.appendChild(iconLink);

    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.type = 'image/png';
    shortcutLink.href = url;
    document.head.appendChild(shortcutLink);

    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = url;
    document.head.appendChild(appleLink);
  };

  /**
   * Dynamic MUI theme that reacts to branding color changes
   */
  const dynamicTheme = useMemo(() => {
    const primary = branding.primary_color || '#5D87FF';
    const secondary = branding.secondary_color || '#49BEFF';

    return createTheme({
      direction: 'ltr',
      palette: {
        primary: {
          main: primary,
          light: `${primary}1A`,
          dark: primary,
        },
        secondary: {
          main: secondary,
          light: `${secondary}1A`,
          dark: secondary,
        },
        success: {
          main: '#13DEB9',
          light: '#E6FFFA',
          dark: '#02b3a9',
          contrastText: '#ffffff',
        },
        info: {
          main: '#539BFF',
          light: '#EBF3FE',
          dark: '#1682d4',
          contrastText: '#ffffff',
        },
        error: {
          main: '#FA896B',
          light: '#FDEDE8',
          dark: '#f3704d',
          contrastText: '#ffffff',
        },
        warning: {
          main: '#FFAE1F',
          light: '#FEF5E5',
          dark: '#ae8e59',
          contrastText: '#ffffff',
        },
        grey: {
          100: '#F2F6FA',
          200: '#EAEFF4',
          300: '#DFE5EF',
          400: '#7C8FAC',
          500: '#5A6A85',
          600: '#2A3547',
        },
        text: {
          primary: '#2A3547',
          secondary: '#5A6A85',
        },
        action: {
          disabledBackground: 'rgba(73,82,88,0.12)',
          hoverOpacity: 0.02,
          hover: '#f6f9fc',
        },
        divider: '#e5eaef',
      },
      typography,
      shadows,
    });
  }, [branding.primary_color, branding.secondary_color]);

  const refreshBranding = () => {
    return fetchBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding, dynamicTheme }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};
