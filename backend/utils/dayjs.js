import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Lấy thời gian hiện tại chuẩn Việt Nam (UTC+7).
 * Để MongoDB hiển thị đúng ngày Việt Nam trong database viewer (vốn mặc định dùng UTC),
 * chúng ta cộng thêm 7 tiếng vào thời gian UTC trước khi lưu.
 */
export const getVietnamTime = () => {
    // Lấy thời gian hiện tại, cộng thêm 7 giờ để khớp với múi giờ Việt Nam
    // Điều này giúp MongoDB (vốn lưu UTC) hiển thị đúng con số giờ Việt Nam
    return dayjs().utc().add(7, 'hour').toDate();
};

/**
 * Định dạng Date object sang chuỗi ngày tháng Việt Nam
 * Nếu date đã là date "đã offset", chúng ta cần trừ đi 7 giờ để về đúng UTC thực tế 
 * HOẶC đơn giản là hiển thị trực tiếp giá trị đó nếu format là local.
 */
export const formatVietnamTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return null;
    // Vì chúng ta đã lưu "offset +7" vào DB, nên khi lấy ra để định dạng, 
    // ta coi nó như đã là giờ VN rồi.
    return dayjs(date).utc().format(format);
};

export default dayjs;
