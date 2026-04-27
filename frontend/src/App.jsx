import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useRoutes } from 'react-router-dom';
import Router from './routes/Router';
import { BrandingProvider, useBranding } from './contexts/BrandingContext';

/**
 * Inner app that consumes dynamic theme from branding
 */
function AppContent() {
  const { dynamicTheme } = useBranding();
  const routing = useRoutes(Router);

  return (
    <ThemeProvider theme={dynamicTheme}>
      <CssBaseline />
      {routing}
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrandingProvider>
      <AppContent />
    </BrandingProvider>
  );
}

export default App;
