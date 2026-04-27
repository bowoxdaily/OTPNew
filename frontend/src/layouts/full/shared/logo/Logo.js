import { Link } from "react-router-dom";
import { ReactComponent as LogoDark1 } from "src/assets/images/logos/dark1-logo.svg";
import { styled } from "@mui/material";
import { useBranding } from "src/contexts/BrandingContext";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  const { branding } = useBranding();

  return (
    <LinkStyled
      to="/"
      height={70}
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      {branding?.logo_url ? (
        <img 
          src={branding.logo_url} 
          alt="Logo"
          style={{ height: '100%', width: '100%', objectFit: 'contain' }}
        />
      ) : (
        <LogoDark1 />
      )}
    </LinkStyled>
  );
};

export default Logo;
