const success = (data = null, message = '操作成功') => {
  return { code: 200, message, data };
};

const fail = (message = '操作失败', code = 400) => {
  return { code, message, data: null };
};

const unauthorized = (message = '未授权') => {
  return { code: 401, message, data: null };
};

const forbidden = (message = '禁止访问') => {
  return { code: 403, message, data: null };
};

const notFound = (message = '资源未找到') => {
  return { code: 404, message, data: null };
};

module.exports = { success, fail, unauthorized, forbidden, notFound };