// config.js

const API_CONFIG = {
  // 正式環境的 API URL
  apiUrl: "https://script.google.com/macros/s/AKfycbytpmTMqGHp0KKAjr4SzV6jRfb4gR9mkWGxLTdqYhimT9Q_QlQFqs_NfOL5jpIf82Vg/exec",
  
  // 新增回呼網址
  redirectUrl: "https://eric693.github.io/check_manager_v2/"
  // 你也可以在這裡加入其他設定，例如：
  // timeout: 5000,
  // version: 'v4.2.2'
};
// 👇 新增：為了兼容性，同時定義全域變數 apiUrl
const apiUrl = API_CONFIG.apiUrl;
