module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  ignorePatterns: ["node_modules/"],
  extends: [
    "airbnb",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    camelcase: 0,
    eqeqeq: "off",
    "consistent-return": "off",
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "object-curly-spacing": "off",
    "no-unused-vars": "off",
    "import/extensions": 0,
    "import/prefer-default-export": 0,
    "no-plusplus": 0,
    "no-param-reassign": 0,
    "no-shadow": "off",
    "import/no-cycle": [1, { maxDepth: 1 }],
    "no-nested-ternary": 0,
    "no-use-before-define": "off",
    "max-classes-per-file": ["error", 2],
    // "no-underscore-dangle": ["error", { allowAfterSuper: true, allowAfterThis: true }],
    "dot-notation": 0,
    // "no-restricted-syntax": 1,
    // "no-unused-expressions": [1, { allowShortCircuit: false, allowTernary: false }],
    "no-void": [1, { allowAsStatement: true }],
    "no-console": ["error", { allow: ["warn", "error", "info", "log"] }],
    "react/react-in-jsx-scope": 0,
    "react/prop-types": 0,
    "react/jsx-filename-extension": [1, { extensions: [".ts", ".tsx"] }],
    "react/jsx-props-no-spreading": 0,
    "react/require-default-props": 0,
    "react/function-component-definition": 0,
    "react/jsx-no-constructed-context-values": 0,
    "react/no-array-index-key": 0,
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": 0,
    "@typescript-eslint/no-non-null-asserted-optional-chain": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-use-before-define": "off",
    "jsx-a11y/interactive-supports-focus": "off",
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "no-else-return": "off",
    "no-empty": "off",
    "react/jsx-no-bind": "off",
    "jsx-a11y/no-noninteractive-tabindex": "off",
    "@typescript-eslint/no-explicit-any": ["off"],
    "react/destructuring-assignment": ["off"],
    "@typescript-eslint/no-inferrable-types": ["off"],
    "no-underscore-dangle": "off",
    "react/no-unused-prop-types": "off",
    "new-cap": "off",
    "@typescript-eslint/no-shadow": "off",
    "func-names": "off",
    "no-undef-init": "off",
    "no-useless-return": "off",
    "no-unused-expressions": "off",
    "array-callback-return": "off",
    "prefer-template": "off",
    "no-restricted-syntax": "off",
    "prefer-destructuring": "off",
    "default-param-last": "off",
    "no-await-in-loop": "off",
    "no-lonely-if": "off",
    "react/jsx-boolean-value": "off",
    "react/no-unescaped-entities": "off",
    "jsx-a11y/no-noninteractive-element-interactions": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
