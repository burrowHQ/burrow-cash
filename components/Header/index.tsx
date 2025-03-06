import React, { useState, useEffect } from "react";
import { useTheme, Box, Snackbar, Typography } from "@mui/material";
import { useRouter } from "next/router";
import Link from "next/link";
import WalletButton from "./WalletButton";
import Bridge from "./Bridge";
import Set from "./Set";
import { Wrapper, Logo, Menu, LinkStyled, WrapperMobile } from "./style";
import { useAppSelector } from "../../redux/hooks";
import { isAssetsFetching } from "../../redux/assetsSelectors";
import { helpMenu, mainMenuList, Imenu } from "./menuData";
import MenuMobile from "./MenuMobile";
import { RefreshIcon } from "./svg";
import { DiscordIcon, MediumIcon, TwitterIcon } from "../Footer/svg";
import { LinksWrapper } from "../Footer/style";
import { isMobileDevice } from "../../helpers/helpers";
import { RheaLogo } from "../Icons/IconsV2";

const MenuItem = ({ item }: { item: Imenu }) => {
  const { title, link, allLinks } = item;
  const router = useRouter();
  let isSelected;
  if (item.title == "Markets" && router.route == "/") {
    isSelected = true;
  } else {
    isSelected = !!allLinks?.find((link) => {
      return router.route.includes(link) && link !== "/";
    });
  }
  const style = isSelected ? { color: "#00F7A5" } : {};

  return (
    <Link href={link}>
      <LinkStyled sx={{ ...style }}>{title}</LinkStyled>
    </Link>
  );
};

const HelpMenuItem = () => {
  return (
    <div
      className="flex items-center cursor-pointer text-white  hover:text-opacity-80"
      onClick={() => {
        window.open(helpMenu.link);
      }}
    >
      <span className="mr-1.5 text-base">{helpMenu.title}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.646447 8.64645C0.451184 8.84171 0.451184 9.15829 0.646447 9.35355C0.841709 9.54882 1.15829 9.54882 1.35355 9.35355L0.646447 8.64645ZM9.98528 0.514718C9.98528 0.238576 9.76142 0.0147186 9.48528 0.0147185L4.98528 0.0147189C4.70914 0.0147187 4.48528 0.238577 4.48528 0.514719C4.48528 0.790861 4.70914 1.01472 4.98528 1.01472L8.98528 1.01472L8.98528 5.01472C8.98528 5.29086 9.20914 5.51472 9.48528 5.51472C9.76142 5.51472 9.98528 5.29086 9.98528 5.01472L9.98528 0.514718ZM1.35355 9.35355L9.83883 0.868272L9.13173 0.161165L0.646447 8.64645L1.35355 9.35355Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};
const CommunityItem = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const isMobile = isMobileDevice();

  const handleMouseLeave = () => {
    const id = setTimeout(() => setIsHovered(false), 300);
    setTimeoutId(id);
  };

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsHovered(true);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="inline-block py-3 px-2 cursor-pointer hover:bg-gray-800 border border-transparent hover:border-dark-50 relative rounded-md"
    >
      <svg
        width="13"
        height="3"
        viewBox="0 0 13 3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`fill-current ${isHovered ? "text-white" : "text-blue-200"}`}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 1.5C3 2.32843 2.32843 3 1.5 3C0.671573 3 0 2.32843 0 1.5C0 0.671573 0.671573 0 1.5 0C2.32843 0 3 0.671573 3 1.5ZM8 1.5C8 2.32843 7.32843 3 6.5 3C5.67157 3 5 2.32843 5 1.5C5 0.671573 5.67157 0 6.5 0C7.32843 0 8 0.671573 8 1.5ZM11.5 3C12.3284 3 13 2.32843 13 1.5C13 0.671573 12.3284 0 11.5 0C10.6716 0 10 0.671573 10 1.5C10 2.32843 10.6716 3 11.5 3Z"
        />
      </svg>
      {isHovered && (
        <div className="absolute z-50 top-full left-0 pt-2">
          <div className="w-48 p-2 bg-dark-100 shadow-lg border border-dark-50 rounded-md pt-4 pb-6 px-6">
            <h1 className="text-sm text-gray-300 mb-4">Community</h1>
            <LinksWrapper>
              <Links />
            </LinksWrapper>
            <h1 className="text-sm text-gray-300 mt-4">Developer</h1>
            <div>
              <Github />
              <BugBounty />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const Header = () => {
  const [open, setOpen] = useState(false);
  const isFetching = useAppSelector(isAssetsFetching);
  const theme = useTheme();
  useEffect(() => {
    if (isFetching) {
      setOpen(true);
    }
  }, [isFetching]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Box
      sx={{
        background: theme.custom.headerBackground,
        mb: { xs: "1rem", sm: "2rem" },
      }}
    >
      {/* pc */}
      <div className="xsm:hidden">
        <Wrapper style={{ position: "relative" }}>
          <Logo
            onClick={() => {
              window.open("https://burrow.finance/");
            }}
          >
            {/* <span className=" transform"><LogoIcon /></span> */}
            {/* <img src="/public/logo.svg" width={30} height={30} /> */}
            <img
              src="/rheaLogo.png"
              width={80}
              height={30}
              alt=""
              className="cursor-pointer"
              onClick={() => {
                window.open("https://www.rhea.finance");
              }}
            />
          </Logo>
          <Menu>
            {mainMenuList.map((item) => {
              return <MenuItem key={item.title} item={item} />;
            })}
            <HelpMenuItem />
            <CommunityItem />
          </Menu>
          <Box display="flex" justifyContent="flex-end" alignItems="stretch" className=" gap-4">
            <Bridge />
            <WalletButton />
            <Set />
          </Box>
          <Snackbar
            open={open}
            autoHideDuration={2000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <div className="flex items-center justify-center border border-dark-50 text-sm text-white rounded-md bg-dark-100 px-4 py-3.5">
              <RefreshIcon className="mr-2.5 flex-shrink-0 animate-spin h-5 w-5" /> Refreshing
              assets data...
            </div>
          </Snackbar>
        </Wrapper>
      </div>
      {/* mobile */}
      <div className="lg:hidden p-4">
        <WrapperMobile>
          <Logo
            onClick={() => {
              window.open("https://www.rhea.finance");
            }}
          >
            <RheaLogo />
          </Logo>
          <Box className="flex items-center">
            <WalletButton />
            <MenuMobile />
          </Box>
        </WrapperMobile>
      </div>
    </Box>
  );
};

export default Header;
const Links = () => {
  const theme = useTheme();
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      alignItems="center"
      lineHeight="0"
      sx={{ gap: "32px" }}
    >
      <a
        href="https://twitter.com/rhea_finance"
        title="Twitter"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: theme.custom.footerIcon }}
      >
        <TwitterIcon />
      </a>
      <a
        href="https://discord.gg/rheafinance"
        title="Discord"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: theme.custom.footerIcon }}
      >
        <DiscordIcon />
      </a>
      <a
        href="https://rhea-finance.medium.com/"
        title="Medium"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: theme.custom.footerIcon }}
      >
        <MediumIcon />
      </a>
    </Box>
  );
};
const BugBounty = () => {
  const isMobile = isMobileDevice();
  return (
    <a
      href="https://immunefi.com/bounty/burrow/"
      title="Bug Bounty"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Typography
        fontSize="14px"
        lineHeight="16px"
        style={{ color: isMobile ? "#6F7188" : "#ffffff", letterSpacing: "1px" }}
      >
        Bug Bounty
      </Typography>
    </a>
  );
};

const Github = () => {
  const isMobile = isMobileDevice();
  return (
    <a href="https://github.com/burrowHQ/" title="Github" target="_blank" rel="noopener noreferrer">
      <Typography
        fontSize="14px"
        lineHeight="46px"
        style={{ color: isMobile ? "#6F7188" : "#ffffff", letterSpacing: "1px" }}
      >
        Github
      </Typography>
    </a>
  );
};
