import { useState } from 'react';
import Swal from 'sweetalert2';

function CheckinComponent() {
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState('');

  const handleCheckin = async () => {
    setStatus('Processing...');

    try {
      const response = await fetch('http://192.168.149:4040/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: 'Success!',
           text: 'Returning book successful',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: 'Not Found',
          text: 'The barcode scanned was not found in the system.',
          icon: 'warning'
        });
      }
    } catch (err) {
      setStatus('❌ Error: Could not connect to Proxy');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Koha SIP2 Check-in</h2>
      <input
        type="text"
        placeholder="Scan Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
      />
      <button onClick={handleCheckin}>Return Book</button>
      <p>{status}</p>
    </div>
  );
}

export default CheckinComponent;