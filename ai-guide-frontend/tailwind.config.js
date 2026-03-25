/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx,md}", 
    ],
    theme: {
      extend: {
        colors: {
          primary: '#10b981', // 设置一个护眼的“薄荷绿”作为主色调
        }
      },
    },
    plugins: [],
  }