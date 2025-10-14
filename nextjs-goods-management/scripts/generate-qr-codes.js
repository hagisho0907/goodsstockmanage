const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Mock products data
const products = [
  {
    id: '1',
    sku: 'A001',
    name: 'キャラクターA フィギュア 限定版',
  },
  {
    id: '2', 
    sku: 'B002',
    name: 'キャラクターB ぬいぐるみ',
  },
  {
    id: '3',
    sku: 'C003', 
    name: 'キャラクターC Tシャツ',
  },
  {
    id: '4',
    sku: 'D004',
    name: 'キャラクターD クリアファイル',
  },
  {
    id: '5',
    sku: 'E005',
    name: 'キャラクターE アクリルキーホルダー',
  }
];

async function generateQRCode(product) {
  const qrData = JSON.stringify({
    id: product.id,
    sku: product.sku,
    name: product.name,
    timestamp: new Date().toISOString()
  });
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (err) {
    console.error(`Error generating QR code for ${product.sku}:`, err);
    return null;
  }
}

async function generateAllQRCodes() {
  console.log('Generating QR codes for existing products...');
  
  const qrCodes = {};
  
  for (const product of products) {
    console.log(`Generating QR code for ${product.sku} - ${product.name}`);
    const qrCode = await generateQRCode(product);
    if (qrCode) {
      qrCodes[product.id] = qrCode;
    }
  }
  
  // Save to JSON file for reference
  const outputPath = path.join(__dirname, 'generated-qr-codes.json');
  fs.writeFileSync(outputPath, JSON.stringify(qrCodes, null, 2));
  
  console.log(`QR codes generated and saved to: ${outputPath}`);
  console.log('QR codes for products:');
  
  // Output the QR codes for manual insertion into mockData.ts
  for (const [productId, qrCode] of Object.entries(qrCodes)) {
    const product = products.find(p => p.id === productId);
    console.log(`\n// Product ${product.sku} - ${product.name}`);
    console.log(`qrCode: '${qrCode}',`);
  }
  
  return qrCodes;
}

generateAllQRCodes().catch(console.error);