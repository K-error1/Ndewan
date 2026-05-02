export interface ReceiptData {
  shopName: string;
  address: string;
  phone: string;
  till: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  cashier: string;
  footer: string;
}

export function printReceipt(data: ReceiptData) {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            width: 72mm; 
            margin: 0 auto; 
            padding: 10px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .flex { display: flex; justify-content: space-between; }
          .items { width: 100%; border-collapse: collapse; }
          .items td { padding: 2px 0; }
          .total { font-size: 16px; margin-top: 10px; }
          .footer { font-size: 10px; margin-top: 20px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold" style="font-size: 16px;">${data.shopName}</div>
          <div>${data.address}</div>
          <div>Tel: ${data.phone}</div>
          <div class="bold">TILL: ${data.till}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="flex">
          <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
          <span>Time: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>Cashier: ${data.cashier}</div>
        
        <div class="divider"></div>
        
        <table class="items">
          <thead>
            <tr class="flex bold">
              <th style="flex: 2; text-align: left;">Item</th>
              <th style="flex: 1; text-align: center;">Qty</th>
              <th style="flex: 1; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr class="flex">
                <td style="flex: 2;">${item.name}</td>
                <td style="flex: 1; text-align: center;">${item.qty}</td>
                <td style="flex: 1; text-align: right;">${(item.qty * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="flex bold total">
          <span>TOTAL</span>
          <span>KSH ${data.total.toLocaleString()}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="center footer">
          ${data.footer}
          <br>
          Software by Ndewan Systems
        </div>
        
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
