const PDFDocument = require('pdfkit');

async function createPackingSlip(orderData, shopData) {
  const doc = new PDFDocument();
  const buffers = [];

  return new Promise((resolve, reject) => {
    // Capture PDF data into a buffer
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData); // Resolve the promise with the PDF data
    });

    // Handle errors during PDF generation
    doc.on('error', (err) => {
      console.error('PDF Generation Error:', err);
      reject(err);
    });

    // Add shop information to the PDF
    doc.fontSize(20).text('Packing Slip', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Shop Name: ${shopData.name}`);
    doc.text(`Shop Address: ${shopData.address1}, ${shopData.address2 || ''}, ${shopData.city}, ${shopData.province}, ${shopData.country_name}`);
    doc.text(`Shop Email: ${shopData.email}`);
    doc.moveDown();

    // Add order information to the PDF
    doc.fontSize(12).text(`Order Number: ${orderData.name}`);
    doc.text(`Order Date: ${new Date(orderData.created_at).toLocaleDateString()}`);
    doc.text(`Shipping Address: ${orderData.shipping_address.address1}, ${orderData.shipping_address.address2 || ''}, ${orderData.shipping_address.city}, ${orderData.shipping_address.province}, ${orderData.shipping_address.country}`);
    doc.text(`Currency: ${orderData.currency}`);
    doc.text(`Subtotal: ${orderData.subtotal_price} ${orderData.currency}`);
    doc.text(`Tax: ${orderData.total_tax} ${orderData.currency}`);
    doc.text(`Total: ${orderData.total_price} ${orderData.currency}`);
    doc.moveDown();

    doc.fontSize(16).text('Items:', { underline: true });
    orderData.line_items.forEach((item, index) => {
      doc.moveDown();
      doc.fontSize(12).text(`Item ${index + 1}: ${item.name}`);
      doc.text(`Quantity: ${item.quantity}`);
      doc.text(`Price: ${item.price} ${orderData.currency}`);
      doc.text(`Total: ${(item.quantity * parseFloat(item.price)).toFixed(2)} ${orderData.currency}`);
    });

    // Finalize the PDF
    doc.end();
  });
}

module.exports = { createPackingSlip };
