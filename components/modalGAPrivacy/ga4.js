import ReactGA from "react-ga4";

const GA_ID = window.location.hostname.startsWith("lending.") ? "G-GL2STL8WB4" : "G-MJNEGMP1NR";

ReactGA.initialize(GA_ID);
