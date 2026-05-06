import crypto from 'crypto';
import qs from 'qs';
import moment from 'moment-timezone';

export const createPaymentUrl = (req, res) => {
  const { VNP_TMNCODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL } = process.env;
  const { amount, orderId } = req.body;

  // Lấy IP client
  let ipAddr = req.headers['x-forwarded-for']?.split(',')[0]
    || req.socket?.remoteAddress
    || req.connection?.remoteAddress;
  if (ipAddr === '::1') ipAddr = 'localhost';

  // Tạo timestamp
  const now = moment().tz('Asia/Ho_Chi_Minh');
  const createDate = now.format('YYYYMMDDHHmmss');
  const expireDate = now.clone().add(15, 'minutes').format('YYYYMMDDHHmmss');

  // vnp_TxnRef chỉ chấp nhận chuỗi số, tối đa 100 ký tự
  const txnRef = Date.now().toString();

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNP_TMNCODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanhtoandonhang_${orderId}`,
    vnp_OrderType: 'other',
    vnp_Amount: (parseInt(amount) * 100).toString(),
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  // Encode 2 trường đặc biệt trước khi ký
  vnp_Params.vnp_OrderInfo = encodeURIComponent(vnp_Params.vnp_OrderInfo);
  vnp_Params.vnp_ReturnUrl = encodeURIComponent(vnp_Params.vnp_ReturnUrl);

  const sorted = sortObject(vnp_Params);

  // Ký với encode: false vì đã encode thủ công
  const signData = qs.stringify(sorted, { encode: false });
  const signed = crypto.createHmac('sha512', VNP_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  sorted.vnp_SecureHashType = 'SHA512';
  sorted.vnp_SecureHash = signed;

  const paymentUrl = `${VNP_URL}?${qs.stringify(sorted, { encode: false })}`;
  res.json({ paymentUrl, txnRef });

  function sortObject(obj) {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => (sorted[key] = obj[key]));
    return sorted;
  }
};
