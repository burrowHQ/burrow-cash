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
    allLinks: ["/", "/markets", "/tokenDetail/[id]"],
    icon: <MarketIcon />,
  },
  { title: "Dashboard", link: "/dashboard", allLinks: ["/dashboard"], icon: <DashboardIcon /> },
  { title: "Staking", link: "/staking", allLinks: ["/staking"], icon: <StakeIcon /> },
];
export const helpMenu: Imenu = { title: "Docs", link: "https://docs.burrow.finance/" };
