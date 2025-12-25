import dayjs from 'dayjs';

/**
 * 时间转换器，用于数据库字段的时间格式转换。
 */
export const transformerTime = {
  to: (value: any) => value,
  from: (value: any) => {
    return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : value;
  },
};

/**
 * JSON 转换器，用于数据库字段的 JSON 格式转换。
 */
export const transformerJson = {
  to: (value: any) => value,
  from: (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  },
};
