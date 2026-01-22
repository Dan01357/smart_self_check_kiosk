import { QRCodeSVG } from 'qrcode.react';

const MyQRCode = () => {
  const valueToEncode = "44" + "\n";

  return (
    <div style={{ padding: '40px', background: 'white', display: 'inline-block' }}>
      <h3 style={{ color: 'black', textAlign: 'center' }}>Scan to view Receipt</h3>
      <QRCodeSVG 
        value={valueToEncode} 
        size={256}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"H"}          // Changed to High for better reliability
        includeMargin={true}  // Added white border (CRITICAL for scanning)
      />
    </div>
  );
};

export default MyQRCode;