'use strict';
const https = require("https");
exports.main = async (event, context) => {
  const { code } = event
  if (!code) {
    return {
      code: 500,
      msg: '缺少 code 参数'
    }
  }
  // 微信小程序 AppID 和 AppSecret
  const appId = 'wx3d1fc95956b727be'
  const appSecret = 'f5f17a6bfdb366ce2645f9f4a73061b1'
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(rawData);
          if (parsedData.errcode) {
            reject({ code: parsedData.errcode, msg: parsedData.errmsg });
          } else {
            resolve({ openid: parsedData.openid });
          }
        } catch (error) {
          reject({ code: 500, msg: "解析响应数据失败" });
        }
      });
    }).on("error", (error) => {
      reject({ code: 500, msg: error.message });
    });
  });
}
