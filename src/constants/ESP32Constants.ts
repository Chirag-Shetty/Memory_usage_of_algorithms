export const ESP32_HEAP_SIZE = 32768; // 32KB in bytes
export const ESP32_HEAP_BASE_ADDR = 0x3FFB0000; // Typical ESP32 heap starting address

export const formatESP32Address = (offset: number): string => {
  return `0x${(ESP32_HEAP_BASE_ADDR + offset).toString(16).toUpperCase()}`;
};

export const formatBytes = (bytes: number, includePercentage = false, total = ESP32_HEAP_SIZE): string => {
  if (bytes < 1024) {
    return `${bytes} bytes${includePercentage ? ` (${(bytes/total*100).toFixed(1)}%)` : ''}`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes/1024).toFixed(1)} KB${includePercentage ? ` (${(bytes/total*100).toFixed(1)}%)` : ''}`;
  } else {
    return `${(bytes/(1024*1024)).toFixed(1)} MB${includePercentage ? ` (${(bytes/total*100).toFixed(1)}%)` : ''}`;
  }
};