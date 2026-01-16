
// src/hardware/rfid/RFIDReader.ts

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import {EventEmitter} from 'events';

export interface RFIDTag {
  epc: string;              // Electronic Product Code
  tid: string;              // Tag ID
  rssi: number;             // Signal strength
  timestamp: Date;
}

export class RFIDReader extends EventEmitter {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private isScanning: boolean = false;
  private scannedTags: Map<string, RFIDTag> = new Map();
  
  constructor(
    private portPath: string = '/dev/ttyUSB0',
    private baudRate: number = 115200
  ) {
    super();
  }

  /**
   * Initialize and connect to RFID reader
   */
  async connect(): Promise<void> {
    try {
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.port.on('open', () => {
        console.log('RFID Reader connected');
        this.emit('connected');
      });

      this.port.on('error', (err) => {
        console.error('RFID Reader error:', err);
        this.emit('error', err);
      });

      this.parser.on('data', (data: string) => {
        this.handleTagData(data);
      });

      // Initialize reader
      await this.sendCommand('AT+RESET');
      await this.sendCommand('AT+VERSION');
      
    } catch (error) {
      console.error('Failed to connect to RFID reader:', error);
      throw error;
    }
  }

  /**
   * Start scanning for RFID tags
   */
  async startScanning(): Promise<void> {
    if (!this.port || !this.port.isOpen) {
      throw new Error('RFID reader not connected');
    }

    this.isScanning = true;
    this.scannedTags.clear();
    
    // Start continuous scanning mode
    await this.sendCommand('AT+SCAN=START');
    
    this.emit('scanStarted');
  }

  /**
   * Stop scanning
   */
  async stopScanning(): Promise<void> {
    if (!this.port || !this.port.isOpen) {
      return;
    }

    this.isScanning = false;
    await this.sendCommand('AT+SCAN=STOP');
    
    this.emit('scanStopped', Array.from(this.scannedTags.values()));
  }

  /**
   * Handle incoming tag data
   */
  private handleTagData(data: string): void {
    try {
      // Parse RFID tag data (format depends on reader model)
      // Example: "TAG:3000D8B20000000000000001,RSSI:-45,TID:E200..."
      
      const tagMatch = data.match(/TAG:([0-9A-F]+)/i);
      const rssiMatch = data.match(/RSSI:(-?\d+)/);
      const tidMatch = data.match(/TID:([0-9A-F]+)/i);

      if (tagMatch) {
        const epc = tagMatch[1];
        const rssi = rssiMatch ? parseInt(rssiMatch[1]) : 0;
        const tid = tidMatch ? tidMatch[1] : '';

        const tag: RFIDTag = {
          epc,
          tid,
          rssi,
          timestamp: new Date(),
        };

        // Add to scanned tags (avoid duplicates)
        if (!this.scannedTags.has(epc)) {
          this.scannedTags.set(epc, tag);
          this.emit('tagDetected', tag);
        }
      }
    } catch (error) {
      console.error('Error parsing tag data:', error);
    }
  }

  /**
   * Send command to RFID reader
   */
  private async sendCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.port || !this.port.isOpen) {
        reject(new Error('RFID reader not connected'));
        return;
      }

      this.port.write(command + '\r\n', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get all scanned tags
   */
  getScannedTags(): RFIDTag[] {
    return Array.from(this.scannedTags.values());
  }

  /**
   * Clear scanned tags
   */
  clearTags(): void {
    this.scannedTags.clear();
  }

  /**
   * Disconnect from reader
   */
  async disconnect(): Promise<void> {
    if (this.isScanning) {
      await this.stopScanning();
    }

    if (this.port && this.port.isOpen) {
      this.port.close();
    }
  }

  /**
   * Get reader status
   */
  isConnected(): boolean {
    return this.port !== null && this.port.isOpen;
  }
}

