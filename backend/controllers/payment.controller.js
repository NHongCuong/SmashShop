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
  if (ipAddr === '::1') ipAddr = '127.0.0.1';

  // Tạo timestamp
  const now = moment().tz('Asia/Ho_Chi_Minh');
  const createDate = now.format('YYYYMMDDHHmmss');
  const expireDate = now.add(15, 'minutes').format('YYYYMMDDHHmmss');

  // Chuẩn bị params
  const vnp_Params = {
    vnp_Version:       '2.1.0',
    vnp_Command:       'pay',
    vnp_TmnCode:       VNP_TMNCODE,
    vnp_Locale:        'vn',
    vnp_CurrCode:      'VND',
    vnp_TxnRef:        orderId || Date.now().toString(),
    vnp_OrderInfo:     `${orderId || Date.now()}`,
    vnp_OrderType:     'other',           // hoặc 'topup', 'billpayment', ...
    vnp_Amount:        (parseInt(amount) * 100).toString(),
    vnp_ReturnUrl:     VNP_RETURN_URL,
    vnp_IpAddr:        ipAddr,
    vnp_CreateDate:    createDate,
    vnp_ExpireDate:    expireDate
  };

  vnp_Params.vnp_OrderInfo  = encodeURIComponent(vnp_Params.vnp_OrderInfo);
  vnp_Params.vnp_ReturnUrl  = encodeURIComponent(vnp_Params.vnp_ReturnUrl);
  
  const sorted = sortObject(vnp_Params);
  // Dùng encode: false vì bạn đã tự encode
  const signData = qs.stringify(sorted, { encode: false });
  
  const signed = crypto.createHmac('sha512', VNP_HASH_SECRET)
                       .update(signData, 'utf8')
                       .digest('hex');
  
  // Thêm hashType & hash
  sorted.vnp_SecureHashType = 'SHA512';
  sorted.vnp_SecureHash     = signed;
  
  // Build URL: vì giá trị đã được encode, bạn vẫn dùng encode: false
  const paymentUrl = `${VNP_URL}?${qs.stringify(sorted,{ encode: false })}`;
// console.log("VNPAY Payment URL:", paymentUrl);
res.json({ paymentUrl });

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => (sorted[key] = obj[key]));
  return sorted;
}
};
