const crypto = require("crypto");

// Hmac算法: 需要配置一个密钥（俗称加盐）
function hmacHash(str, secretKey) {
  const curSecretKey = secretKey || "vue-i18n";
  const md5 = crypto.createHmac("md5", curSecretKey);
  return md5.update(str).digest("hex");
}

function validateHashKey(key) {
  return /^[a-zA-Z0-9_]{32}$/.test(key);
}

function hash(str) {
  const md5 = crypto.createHash("md5");
  return md5.update(str).digest("hex");
}

/**
 * 生成 8 位随机数字。
 *
 * @return {string} 8位随机数字
 */
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + s4();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const zhExt = /[\u4e00-\u9fa5]+/;
const zhExt2 = /[\u4e00-\u9fa5]+/g;

function getAllKeys(obj, prefix = "", keys = []) {
  // 确保传入的是对象且不为null（因为typeof null === 'object'）
  if (typeof obj !== "object" || obj === null) {
    return keys;
  }

  Object.keys(obj).forEach((key) => {
    const currentKey = prefix ? `${prefix}.${key}` : key;

    // 如果当前属性的值是对象且不是数组（因为数组也是对象），则递归处理
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      getAllKeys(obj[key], currentKey, keys);
    } else {
      keys.push(currentKey);
    }
  });

  return keys;
}

function md5Hash(str, md5secretKey) {
  if (md5secretKey) {
    return hmacHash(str, md5secretKey);
  }
  return hash(str);
}

const getRootPath = process.env.UNI_INPUT_DIR
  ? () => process.env.UNI_INPUT_DIR
  : () => process.cwd();

function isConsoleLogNode(node) {
  if (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.name === "console" &&
    node.callee.property.name === "log"
  ) {
    return true;
  }
  return false;
}

const VueNodeTypesEnum = {
  ELEMENT: 1,
  TEXT: 2,
  COMMENT: 3,
  SIMPLE_EXPRESSION: 4,
  INTERPOLATION: 5,
  ATTRIBUTE: 6,
  DIRECTIVE: 7,
};

module.exports = {
  hmacHash,
  hash,
  guid,
  sleep,
  validateHashKey,
  getAllKeys,
  md5Hash,
  getRootPath,
  isConsoleLogNode,
  zhExt,
  zhExt2,
  VueNodeTypesEnum,
};
