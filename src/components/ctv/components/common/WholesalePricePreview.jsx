import React from "react";

const vnd = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

export default function WholesalePricePreview({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-center text-secondary text-sm">
        Chưa có sản phẩm nào để xem trước giá sỉ.
      </div>
    );
  }

  const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
  const totalOriginal = items.reduce((s, i) => s + ((i.unitPrice || 0) * (i.qty || 0)), 0);
  const totalAfterDiscount = items.reduce((s, i) => s + (i.subtotal || 0), 0);
  const totalDiscount = totalOriginal - totalAfterDiscount;
  const avgDiscount = totalOriginal > 0 ? ((totalDiscount / totalOriginal) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-3">
      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-300 text-xs">
          💡 Giá cơ sở: Giá bán hiện tại trên website (không phải giá niêm yết cũ). Chiết khấu tính theo tổng số lượng máy đặt mua.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-secondary text-xs border-b border-gray-700">
              <th className="text-left py-2 pr-3">Sản phẩm</th>
              <th className="text-center py-2 px-2">SL</th>
              <th className="text-right py-2 px-2">Đơn giá</th>
              <th className="text-center py-2 px-2">CK%</th>
              <th className="text-right py-2 px-2">Sau CK</th>
              <th className="text-right py-2 pl-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const ckPercent = typeof item.discountRate === "number"
                ? (item.discountRate > 1 ? item.discountRate : item.discountRate * 100).toFixed(0)
                : 0;
              const discountedUnit = (item.unitPrice || 0) * (1 - (item.discountRateDecimal || item.discountRate / 100 || 0));
              return (
                <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                  <td className="py-2 pr-3 text-primary font-medium">{item.serviceName || item.serviceId}</td>
                  <td className="py-2 px-2 text-center text-secondary">{item.qty}</td>
                  <td className="py-2 px-2 text-right text-secondary">{vnd(item.unitPrice)}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-green-400 font-bold">{ckPercent}%</span>
                  </td>
                  <td className="py-2 px-2 text-right text-yellow-300">{vnd(discountedUnit)}</td>
                  <td className="py-2 pl-2 text-right font-semibold text-primary">{vnd(item.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800/60 rounded-lg p-3 space-y-1.5">
        <div className="flex justify-between text-sm text-secondary">
          <span>Tổng số lượng:</span>
          <span className="font-semibold text-primary">{totalQty} máy</span>
        </div>
        <div className="flex justify-between text-sm text-secondary">
          <span>Tổng tiền gốc:</span>
          <span>{vnd(totalOriginal)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-400">
          <span>Chiết khấu ({avgDiscount}%):</span>
          <span className="font-semibold">-{vnd(totalDiscount)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-gray-700 pt-1.5">
          <span className="text-primary">Tổng sau chiết khấu:</span>
          <span className="text-yellow-300">{vnd(totalAfterDiscount)}</span>
        </div>
      </div>
    </div>
  );
}
