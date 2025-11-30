/**
 * Quy đổi tiền tệ sang VND
 * Sử dụng ExchangeRate-API (free tier: 1,500 requests/month)
 */
export async function convertToVND(
  amount: number,
  fromCurrency: string,
  apiKey?: string
): Promise<number> {
  try {
    // Nếu không có API key, dùng tỉ giá cố định
    if (!apiKey) {
      const fallbackRates: Record<string, number> = {
        USD: 25000,
        EUR: 27000,
        JPY: 170,
        KRW: 19,
        CNY: 3500,
        THB: 720,
        SGD: 18500,
        VND: 1,
      };
      return amount * (fallbackRates[fromCurrency] || 1);
    }

    // Gọi API để lấy tỉ giá thời gian thực
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/VND/${amount}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    return data.conversion_result || amount;
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Fallback to fixed rates
    const fallbackRates: Record<string, number> = {
      USD: 25000,
      EUR: 27000,
      JPY: 170,
      KRW: 19,
      CNY: 3500,
      THB: 720,
      SGD: 18500,
      VND: 1,
    };
    return amount * (fallbackRates[fromCurrency] || 1);
  }
}

/**
 * Lấy tỉ giá hiện tại
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  apiKey?: string
): Promise<number> {
  try {
    if (!apiKey) {
      const fallbackRates: Record<string, Record<string, number>> = {
        USD: { VND: 25000, EUR: 0.92, JPY: 147 },
        EUR: { VND: 27000, USD: 1.09, JPY: 160 },
        VND: { USD: 0.00004, EUR: 0.000037, JPY: 0.0059 },
      };
      return fallbackRates[fromCurrency]?.[toCurrency] || 1;
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    return data.conversion_rate || 1;
  } catch (error) {
    console.error('Get exchange rate error:', error);
    return 1;
  }
}