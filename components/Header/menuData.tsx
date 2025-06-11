import { MarketIcon, StakeIcon, DashboardIcon } from "./svg";

export type Imenu = {
  title: string;
  link: string;
  allLinks?: string[];
  icon?: React.ReactElement;
};
export const mainMenuList: Imenu[] = [
  {
    title: "Markets",
    link: "/markets",
    allLinks: ["/", "/markets", "/tokenDetail"],
    icon: <MarketIcon />,
  },
  {
    title: "Margin Trading",
    link: "/marginTrading",
    allLinks: ["/marginTrading", "/trading"],
    icon: <MarketIcon />,
  },
  {
    title: "Dashboard",
    link: "/dashboard",
    allLinks: ["/dashboard", "/dashboardDetail"],
    icon: <DashboardIcon />,
  },
  {
    title: "Staking",
    link: "/staking",
    allLinks: ["/staking"],
    icon: <StakeIcon />,
  },
];
export const helpMenu: Imenu = { title: "Docs", link: "https://guide.rhea.finance/" };
export const dexMenu: Imenu = { title: "Dex", link: "https://dex.rhea.finance/" };
