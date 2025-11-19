// config.js

const API_CONFIG = {
  // 正式環境的 API URL
  apiUrl: "https://script.google.com/macros/s/AKfycbxpu8CcMNxMD-C5IclcRN8OsE-jDMcVBQwh_G1p3pm2lw5YMT2W9AHk3mtPO0Lo6Wdh/exec",
  
  // 新增回呼網址
  redirectUrl: "https://eric693.github.io/jiman/"
  // 你也可以在這裡加入其他設定，例如：
  // timeout: 5000,
  // version: 'v4.2.2'
};
// 👇 新增：為了兼容性，同時定義全域變數 apiUrl
const apiUrl = API_CONFIG.apiUrl;
