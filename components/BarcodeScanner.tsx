import React, { useEffect, useRef } from 'react';

// QuaggaJS is loaded from a CDN, so we need to declare it for TypeScript
declare const Quagga: any;

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetect, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (scannerRef.current) {
      Quagga.init({
        inputStream : {
          name : "Live",
          type : "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder : {
          readers : [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          }
        },
        locate: true,
      }, (err: any) => {
          if (err) {
              console.error("Quagga initialization failed:", err);
              return
          }
          Quagga.start();
      });

      const handleDetected = (data: any) => {
        onDetect(data.codeResult.code);
        Quagga.offDetected(handleDetected);
      };

      Quagga.onDetected(handleDetected);
    }

    return () => {
      isMounted.current = false;
      Quagga.stop();
    };
  }, [onDetect]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-lg p-2 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* The video stream will be attached here by Quagga */}
        <div ref={scannerRef} id="scanner-container" style={{ width: '100%', height: 'auto', position: 'relative' }}>
            {/* Quagga will create a video and canvas element inside this div */}
        </div>
      </div>
      <p className="text-white mt-4 text-lg font-medium">Point your camera at a barcode</p>
      <button 
        onClick={onClose}
        className="mt-6 px-8 py-3 bg-white text-gray-800 font-bold rounded-full shadow-lg hover:bg-gray-200 transition-transform transform hover:scale-105"
      >
        Cancel
      </button>
    </div>
  );
};