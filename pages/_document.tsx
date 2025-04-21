import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const SITE_META = {
    title: "RHEA Finance",
    image: "https://img.ref.finance/images/rhea-twitter-share2.jpg",
    url: "http://lending.rhea.finance",
  };
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
          rel="stylesheet"
        />
        <meta
          name="description"
          content="The first DEX on NEAR. The Chain-Abstracted Liquidity Solution. NEAR wallet to store, buy, send and stake assets for DeFi."
        />
        <meta
          name="keywords"
          content="NEAR DEX,DEX on NEAR,Top dex on NEAR, DEX, Lending, Borrow, Margin Trading"
        />
        <meta property="twitter:title" content={SITE_META.title} key="twitter-title" />
        <meta property="twitter:site" content={SITE_META.title} key="twitter-site" />
        <meta property="twitter:image" content={SITE_META.image} key="twitter-image" />
        <meta property="twitter:image:src" content={SITE_META.image} key="twitter-image-src" />
        <meta property="twitter:card" content="summary_large_image" />

        <meta property="og:url" content={SITE_META.url} />
        <meta property="og:title" content={SITE_META.title} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_META.title} />
        <meta property="og:image" content={SITE_META.image} key="og-image" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest" />
      </Head>
      <body id="root">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
