import QRCode from 'qrcode';

// Generate crop QR
export const generateCropQR = async (cropId) => {
  try {
    const qrData = JSON.stringify({
      type: 'crop',
      id: cropId,
      timestamp: new Date().toISOString()
    });

    return {
      qrData,
      qrBase64: await QRCode.toDataURL(qrData),
      qrUrl: `/api/crops/qr/${cropId}`
    };
  } catch (err) {
    console.error('QR Generation Error:', err);
    return {
      qrData: JSON.stringify({ type: 'crop', id: cropId }),
      qrBase64: '',
      qrUrl: ''
    };
  }
};

// Generate shipment QR
export const generateShipmentQR = async (trackingNumber) => {
  try {
    const qrData = JSON.stringify({
      type: 'shipment',
      trackingNumber,
      timestamp: new Date().toISOString()
    });

    return {
      qrData,
      qrBase64: await QRCode.toDataURL(qrData),
      qrUrl: `/api/shipments/track/${trackingNumber}`
    };
  } catch (err) {
    console.error('Shipment QR Error:', err);
    return {
      qrData: JSON.stringify({ type: 'shipment', trackingNumber }),
      qrBase64: '',
      qrUrl: ''
    };
  }
};

// Parse QR data
export const parseQRData = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch {
    throw new Error('Invalid QR code data');
  }
};

export default {
  generateCropQR,
  generateShipmentQR,
  parseQRData
};
