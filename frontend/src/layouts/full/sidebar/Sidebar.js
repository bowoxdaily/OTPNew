import { useMediaQuery, Box, Drawer } from '@mui/material';
import SidebarItems from './SidebarItems';
import { Upgrade } from './Updrade';
import { Sidebar } from 'react-mui-sidebar';
import { useBranding } from 'src/contexts/BrandingContext';
import { Link } from 'react-router-dom';

/**
 * Custom Logo component for sidebar that properly constrains uploaded images
 */
const SidebarLogo = () => {
  const { branding } = useBranding();

  return (
    <Box
      component={Link}
      to="/"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
        px: 2,
        textDecoration: 'none',
      }}
    >
      {branding?.logo_url ? (
        <Box
          component="img"
          src={branding.logo_url}
          alt={branding.brand_name || 'Logo'}
          sx={{
            maxHeight: 50,
            maxWidth: 180,
            objectFit: 'contain',
          }}
        />
      ) : (
        <Box
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'primary.main',
          }}
        >
          {branding?.brand_name || 'OTP Reseller'}
        </Box>
      )}
    </Box>
  );
};

const MSidebar = (props) => {
  const { branding } = useBranding();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const sidebarWidth = '270px';

  const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '7px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#eff2f7',
      borderRadius: '15px',
    },
  };

  const themeColor = branding?.primary_color || '#5d87ff';
  const themeSecondary = branding?.secondary_color || '#49beff';

  if (lgUp) {
    return (
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
        }}
      >
        <Drawer
          anchor="left"
          open={props.isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              boxSizing: 'border-box',
              ...scrollbarStyles,
            },
          }}
        >
          <Box sx={{ height: '100%' }}>
            <Sidebar
              width={'270px'}
              collapsewidth="80px"
              open={props.isSidebarOpen}
              themeColor={themeColor}
              themeSecondaryColor={themeSecondary}
              showProfile={false}
            >
              <SidebarLogo />
              <Box>
                <SidebarItems />
              </Box>
            </Sidebar>
          </Box>
        </Drawer>
      </Box>
    );
  }
  return (
    <Drawer
      anchor="left"
      open={props.isMobileSidebarOpen}
      onClose={props.onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          boxShadow: (theme) => theme.shadows[8],
          ...scrollbarStyles,
        },
      }}
    >
      <Sidebar
        width={'270px'}
        collapsewidth="80px"
        isCollapse={false}
        mode="light"
        direction="ltr"
        themeColor={themeColor}
        themeSecondaryColor={themeSecondary}
        showProfile={false}
      >
        <SidebarLogo />
        <SidebarItems />
        <Upgrade />
      </Sidebar>
    </Drawer>
  );
};
export default MSidebar;
