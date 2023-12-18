import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['./src/index.ts'],
    format: ['cjs', 'esm'],
    target: "es2022",
    clean: true,
    dts: true,
    tsconfig: './tsconfig.json',
})