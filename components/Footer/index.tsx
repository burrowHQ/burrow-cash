import { Link, Box, useTheme, Typography } from "@mui/material";
import NextLink from "next/link";
import { TwitterIcon, DiscordIcon, MediumIcon } from "./svg";
import { Wrapper, CopyWrapper, LinksWrapper } from "./style";
import { isMobileDevice } from "../../helpers/helpers";

const Footer = () => {
  const isMobile = isMobileDevice();
  return (
    <Wrapper>
      {isMobile ? (
        <>
          <CopyWrapper>
            <Github />
            <BugBounty />
            <LinksWrapper>
              <Declaration />
            </LinksWrapper>
          </CopyWrapper>
          <LinksWrapper>
            <Links />
          </LinksWrapper>
        </>
      ) : (
        <>
          <CopyWrapper>
            <LinksWrapper>
              <Declaration />
            </LinksWrapper>
          </CopyWrapper>
          <LinksWrapper>
            <Github />
            <BugBounty />
            <Links />
          </LinksWrapper>
        </>
      )}
    </Wrapper>
  );
};

const Links = () => {
  const theme = useTheme();
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      alignItems="center"
      lineHeight="0"
      sx={{ gap: "26px" }}
    >
      <Link
        href="https://twitter.com/burrow_finance"
        title="Twitter"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <TwitterIcon />
      </Link>
      <Link
        href="https://discord.gg/reffinance"
        title="Discord"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <DiscordIcon />
      </Link>
      <Link
        href="https://burrowfinance.medium.com/"
        title="Medium"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <MediumIcon />
      </Link>
    </Box>
  );
};

export const Declaration = () => {
  const isMobile = isMobileDevice();
  return (
    <NextLink href="/declaration" passHref>
      <Link
        href="/declaration"
        target="_blank"
        underline="none"
        color={isMobile ? "#6F7188" : "#C0C4E9"}
      >
        Declaration and Disclaimers
      </Link>
    </NextLink>
  );
};

const BugBounty = () => {
  const isMobile = isMobileDevice();
  return (
    <Link
      href="https://immunefi.com/bounty/burrow/"
      title="Bug Bounty"
      target="_blank"
      underline="none"
    >
      <Typography
        fontSize="12px"
        lineHeight="12px"
        style={{ color: isMobile ? "#6F7188" : "#C0C4E9" }}
      >
        Bug Bounty
      </Typography>
    </Link>
  );
};

const Github = () => {
  const isMobile = isMobileDevice();
  return (
    <Link href="https://github.com/burrowHQ/" title="Github" target="_blank" underline="none">
      <Typography
        fontSize="12px"
        lineHeight="12px"
        style={{ color: isMobile ? "#6F7188" : "#C0C4E9" }}
      >
        Github
      </Typography>
    </Link>
  );
};

export default Footer;
