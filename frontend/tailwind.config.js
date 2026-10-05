/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // 이 부분이 꼭 있어야 src 내부의 vue 파일을 인식합니다.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
