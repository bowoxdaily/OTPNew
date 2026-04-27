import React, { useState } from "react";
import { styled, Container, Box, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { useBranding } from "src/contexts/BrandingContext";
import GlobalTopupListener from "src/components/GlobalTopupListener";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

const FullLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { branding } = useBranding();

  return (
    <MainWrapper className="mainwrapper">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />
      {/* Main Wrapper */}
      <PageWrapper className="page-wrapper">
        {/* Header */}
        <Header
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          toggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        {/* Page Content */}
        <Container
          sx={{
            paddingTop: "20px",
            maxWidth: "1200px",
          }}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>
            <Outlet />
          </Box>
        </Container>
        {/* Footer */}
        <Box sx={{ pt: 6, pb: 3, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {branding.brand_name || 'OTP Reseller'}. All rights reserved.
          </Typography>
        </Box>
        {/* Global Topup Listener */}
        <GlobalTopupListener />
      </PageWrapper>
    </MainWrapper>
  );
};

export default FullLayout;
