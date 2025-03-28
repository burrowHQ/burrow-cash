/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.ref.finance",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack(config, { isServer, webpack, buildId }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.CONFIG_BUILD_ID": JSON.stringify(buildId),
      }),
    );
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    config.module.rules.push({
      test: /.js$/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env"],
        },
      },
      exclude: /node_modules/,
    });
    config.module.rules.push({
      test: /satoshi-wellet/,
      use: [
        {
          loader: "ts-loader",
          options: {
            compilerOptions: { noEmit: false },
            onlyCompileBundledFiles: true,
            allowTsInNodeModules: true,
          },
        },
      ],
    });

    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    return config;
  },
};
