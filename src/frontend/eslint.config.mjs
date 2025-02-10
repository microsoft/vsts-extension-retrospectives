import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["node_modules/**/*.*", "dist/**/*.*"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        react,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        indent: "off",
        quotes: "off",
        "react/jsx-key": "off",
        "react/no-direct-mutation-state": "off",

        "no-multiple-empty-lines": ["error", {
            max: 1,
        }],

        "no-trailing-spaces": [2, {
            skipBlankLines: true,
        }],

        "@typescript-eslint/ban-types": "off",
        "jsx-quotes": ["error", "prefer-double"],
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/comma-spacing": "error",
        "@typescript-eslint/no-unnecessary-type-constraint": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/triple-slash-reference": "off",
        "@typescript-eslint/no-unused-vars": "off",
    },
}];