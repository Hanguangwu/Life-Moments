import js from "@eslint/js"
import pluginVue from "eslint-plugin-vue"
import vueEslintParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'

export default [
    {
        files: ["**/*.{ts, tsx, vue}"],
        rules: {
            ...js.configs.recommended.rules,
            "vue/html-self-closing": "error",
            "no-console": "error"
        },
        languageOptions: {
            parser: vueEslintParser,
            parserOptions: {
                extraFileExtension: ['.vue'],
                parser: tsParser
            }
        },
        plugins: {
            vue: pluginVue
        }
    },
]