import dayjs from "dayjs";

export function formatPrice(value: number) {
  // 金额必须保留到分，toFixed(1) 会把 128.25 显示成 128.3
  return Number(value)
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

export function formatDate(value: string | number | Date, pattern = "MM-DD") {
  return dayjs(value).format(pattern);
}

export function formatDateTime(value: string | number | Date, pattern = "YYYY-MM-DD HH:mm") {
  return dayjs(value).format(pattern);
}

export function maskMobile(mobile: string) {
  return mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

export function calcStayDays(checkIn: string, checkOut: string) {
  const start = dayjs(checkIn);
  const end = dayjs(checkOut);
  const days = end.diff(start, "day");
  return days > 0 ? days : 1;
}
