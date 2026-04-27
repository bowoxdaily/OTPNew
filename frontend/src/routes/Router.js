import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { getUserRole, getUserSession } from 'src/utils/authSession';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const AdminDashboard = Loadable(lazy(() => import('../views/dashboard/AdminDashboard')));
const UserDashboard = Loadable(lazy(() => import('../views/dashboard/UserDashboard')));
const BeliNomor = Loadable(lazy(() => import('../views/user/BeliNomor')));
const CekOtp = Loadable(lazy(() => import('../views/user/CekOtp')));
const Topup = Loadable(lazy(() => import('../views/user/Topup')));
const MutasiSaldo = Loadable(lazy(() => import('../views/user/MutasiSaldo')));
const MarkupManagement = Loadable(lazy(() => import('../views/admin/MarkupManagement')));
const AdminLayanan = Loadable(lazy(() => import('../views/admin/AdminLayanan')));
const BrandingManagement = Loadable(lazy(() => import('../views/admin/BrandingManagement')));
const AdminTopup = Loadable(lazy(() => import('../views/admin/AdminTopup')));
const PaymentGatewaySettings = Loadable(lazy(() => import('../views/admin/PaymentGatewaySettings')));
const AdminOrders = Loadable(lazy(() => import('../views/admin/AdminOrders')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')))
const Icons = Loadable(lazy(() => import('../views/icons/Icons')))
const TypographyPage = Loadable(lazy(() => import('../views/utilities/TypographyPage')))
const Shadow = Loadable(lazy(() => import('../views/utilities/Shadow')))
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));

const RequireAuth = ({ children }) => {
  const session = getUserSession();
  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

const RequireRole = ({ role, children }) => {
  const userRole = getUserRole();
  if (userRole !== role) {
    return <Navigate to={userRole === 'admin' ? '/dashboard/admin' : '/dashboard/user'} replace />;
  }
  return children;
};

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard/user" /> },
      { path: '/dashboard', element: <Navigate to="/dashboard/user" /> },
      {
        path: '/dashboard/admin',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><AdminDashboard /></RequireRole></RequireAuth>,
      },
      {
        path: '/admin/markups',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><MarkupManagement /></RequireRole></RequireAuth>,
      },
      {
        path: '/admin/layanan',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><AdminLayanan /></RequireRole></RequireAuth>,
      },
      {
        path: '/admin/branding',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><BrandingManagement /></RequireRole></RequireAuth>,
      },
      {
        path: '/admin/topup',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><AdminTopup /></RequireRole></RequireAuth>,
      },
      {
        path: '/admin/payment-gateway',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><PaymentGatewaySettings /></RequireRole></RequireAuth>,
      },
      {
        path: '/admin/orders',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><AdminOrders /></RequireRole></RequireAuth>,
      },
      {
        path: '/dashboard/user',
        exact: true,
        element: <RequireAuth><RequireRole role="user"><UserDashboard /></RequireRole></RequireAuth>,
      },
      {
        path: '/otp/beli-nomor',
        exact: true,
        element: <RequireAuth><RequireRole role="user"><BeliNomor /></RequireRole></RequireAuth>,
      },
      {
        path: '/otp/cek-otp',
        exact: true,
        element: <RequireAuth><RequireRole role="user"><CekOtp /></RequireRole></RequireAuth>,
      },
      {
        path: '/user/topup',
        exact: true,
        element: <RequireAuth><RequireRole role="user"><Topup /></RequireRole></RequireAuth>,
      },
      {
        path: '/otp/mutasi-saldo',
        exact: true,
        element: <RequireAuth><RequireRole role="user"><MutasiSaldo /></RequireRole></RequireAuth>,
      },
      {
        path: '/otp/status-provider',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><AdminDashboard /></RequireRole></RequireAuth>,
      },
      {
        path: '/otp/dokumentasi-api',
        exact: true,
        element: <RequireAuth><RequireRole role="admin"><AdminDashboard /></RequireRole></RequireAuth>,
      },
      { path: '/sample-page', exact: true, element: <SamplePage /> },
      { path: '/icons', exact: true, element: <Icons /> },
      { path: '/ui/typography', exact: true, element: <TypographyPage /> },
      { path: '/ui/shadow', exact: true, element: <Shadow /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '/auth/register', element: <Register /> },
      { path: '/auth/login', element: <Login /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

export default Router;
