/**
 * Indian currency & number formatting utilities
 */

export const formatINR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(2) + ' L';
  return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
};

export const formatINRCompact = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(1) + ' Cr';
  if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(1) + ' L';
  return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
};

export const formatPrice = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '₹0.00';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatVolume = (vol) => {
  if (!vol) return '0';
  if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr';
  if (vol >= 100000) return (vol / 100000).toFixed(2) + ' L';
  return vol.toLocaleString('en-IN');
};

export const formatPercent = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0.00%';
  const sign = n >= 0 ? '+' : '';
  return sign + Number(n).toFixed(2) + '%';
};

export const formatMarketCap = (n) => {
  if (!n) return '—';
  if (n >= 1e12) return '₹' + (n / 1e12).toFixed(2) + ' T';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN');
};

export const API_BASE = 'http://localhost:8081';
