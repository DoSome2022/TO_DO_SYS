"use client";

export function usePDFExport() {
  const exportToPDF = (fileName: string) => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        /* 重置所有元素可見性 */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          visibility: visible !important;
          position: static !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        body * {
          visibility: visible !important;
        }
        /* 隱藏所有操作按鈕、連結，唔印操作元件 */
        button, a, [role="button"], .no-print {
          display: none !important;
        }
        /* 清除所有絕對/浮動定位，防止重疊 */
        div, section, main, header {
          position: static !important;
          float: none !important;
          width: 100% !important;
        }
        /* 頁面分頁優化，避免內容切斷 */
        section {
          page-break-inside: avoid;
        }
        /* 移除頁邊多餘空白 */
        @page {
          margin: 16mm;
        }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
    }, 100);
  };

  return { exportToPDF };
}