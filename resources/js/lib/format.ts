export const formatRupiah = (angka: number | string): string => {
  const number = typeof angka === "string" ? parseFloat(angka) : angka;
  return number.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
};
