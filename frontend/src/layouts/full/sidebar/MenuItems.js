import {
  IconAperture, IconCopy, IconLayoutDashboard, IconLogin, IconMoodHappy, IconTypography, IconUserPlus, IconUsers, IconDots, IconCash, IconShoppingCart, IconPalette, IconSettings
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const allMenuItems = [
  {
    navlabel: true,
    subheader: 'OTP Reseller',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard/user',
  },
  {
    id: uniqueId(),
    title: 'Dashboard Admin',
    icon: IconUsers,
    href: '/dashboard/admin',
  },
  {
    id: uniqueId(),
    title: 'Manajemen Markup',
    icon: IconCash,
    href: '/admin/markups',
  },
  {
    id: uniqueId(),
    title: 'Daftar Layanan',
    icon: IconShoppingCart,
    href: '/admin/layanan',
  },
  {
    id: uniqueId(),
    title: 'Manajemen Branding',
    icon: IconPalette,
    href: '/admin/branding',
  },
  {
    id: uniqueId(),
    title: 'Konfirmasi Top Up',
    icon: IconCash,
    href: '/admin/topup',
  },
  {
    id: uniqueId(),
    title: 'Riwayat Order',
    icon: IconCopy,
    href: '/admin/orders',
  },
  {
    id: uniqueId(),
    title: 'Setting Payment Gateway',
    icon: IconSettings,
    href: '/admin/payment-gateway',
  },
  {
    id: uniqueId(),
    title: 'Beli Nomor',
    icon: IconTypography,
    href: '/otp/beli-nomor',
  },
  {
    id: uniqueId(),
    title: 'Cek OTP',
    icon: IconCopy,
    href: '/otp/cek-otp',
  },
  {
    id: uniqueId(),
    title: 'Top Up Saldo',
    icon: IconCash,
    href: '/user/topup',
  },
  {
    id: uniqueId(),
    title: 'Mutasi Saldo',
    icon: IconAperture,
    href: '/otp/mutasi-saldo',
  },
  {
    navlabel: true,
    subheader: 'Akun',
  },
  {
    id: uniqueId(),
    title: 'Login',
    icon: IconLogin,
    href: '/auth/login',
  },
  {
    id: uniqueId(),
    title: 'Register',
    icon: IconUserPlus,
    href: '/auth/register',
  },
  {
    navlabel: true,
    subheader: 'Lainnya',
  },
  {
    id: uniqueId(),
    title: 'Status Provider',
    icon: IconMoodHappy,
    href: '/otp/status-provider',
  },
  {
    id: uniqueId(),
    title: 'Dokumentasi API',
    icon: IconAperture,
    href: '/otp/dokumentasi-api',
  },
];

export function getMenuItemsByRole(role = 'user') {
  if (role === 'admin') {
    return allMenuItems.filter((item) => {
      // Tampilkan header kecuali 'Akun'
      if (item.subheader) {
        return item.subheader !== 'Akun';
      }
      // Sembunyikan menu user dan auth dari admin
      const hiddenFromAdmin = [
        '/dashboard/user',
        '/otp/beli-nomor',
        '/otp/cek-otp',
        '/auth/login',
        '/auth/register'
      ];
      return !hiddenFromAdmin.includes(item.href);
    });
  }

  // User role
  return allMenuItems.filter((item) => {
    if (item.subheader) {
      return item.subheader !== 'Akun'; 
    }
    const userMenus = [
      '/dashboard/user',
      '/user/topup',
      '/otp/beli-nomor',
      '/otp/cek-otp',
      '/otp/mutasi-saldo',
      '/otp/status-provider',
      '/otp/dokumentasi-api'
    ];
    return userMenus.includes(item.href);
  });
}

export default allMenuItems;
