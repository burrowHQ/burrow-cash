import { Link, Divider, Box, useTheme, Typography } from "@mui/material";
import NextLink from "next/link";

import { FaDiscord } from "@react-icons/all-files/fa/FaDiscord";
import { FaTwitter } from "@react-icons/all-files/fa/FaTwitter";
import { FaMedium } from "@react-icons/all-files/fa/FaMedium";
import { FaGithub } from "@react-icons/all-files/fa/FaGithub";

import Logo from "./logo.svg";
import Gitbook from "../../public/GitBook.svg";
import { Wrapper, CopyWrapper, LinksWrapper, LogoWrapper, Copyright } from "./style";

const Footer = () => {
  const theme = useTheme();
  return (
    <Wrapper>
      <CopyWrapper>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
        <Copyright variant="h6" color={theme.custom.footerText}>
          © 2022 All Rights Reserved.
        </Copyright>
        <LinksWrapper>
          <Declaration />
        </LinksWrapper>
      </CopyWrapper>
      <LinksWrapper>
        <BugBounty />
        <Links />
      </LinksWrapper>
    </Wrapper>
  );
};

const Links = () => {
  const theme = useTheme();
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(5, 1fr)"
      alignItems="center"
      lineHeight="0"
      sx={{ gap: ["0.5rem", "1rem"] }}
    >
      <Link
        href="https://github.com/burrowfdn/"
        title="GitHub"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <FaGithub />
      </Link>
      <Link
        href="https://discord.gg/gUWBKy9Vur"
        title="Discord"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <FaDiscord />
      </Link>
      <Link
        href="https://twitter.com/burrowcash"
        title="Twitter"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <FaTwitter />
      </Link>
      <Link
        href="https://burrowcash.medium.com/"
        title="Medium"
        target="_blank"
        color={theme.custom.footerIcon}
      >
        <FaMedium />
      </Link>
      <Link
        href="https://docs.burrow.cash/"
        title="Docs"
        target="_blank"
        color={theme.custom.footerIcon}
        width="16px"
      >
        <Gitbook fill={theme.custom.footerIcon} />
      </Link>
    </Box>
  );
};

export const Declaration = () => {
  const theme = useTheme();
  return (
    <>
      <Divider orientation="vertical" flexItem color={theme.palette.background.paper} />
      <NextLink href="/declaration" passHref>
        <Link href="/declaration" underline="none" color={theme.custom.footerText}>
          Declaration and Disclaimers
        </Link>
      </NextLink>
    </>
  );
};

const BugBounty = () => (
  <Link
    href="https://immunefi.com/bounty/burrow/"
    title="Bug Bounty"
    target="_blank"
    underline="none"
  >
    <Typography fontSize="12px" lineHeight="12px">
      Bug Bounty
    </Typography>
  </Link>
);

export default Footer;
