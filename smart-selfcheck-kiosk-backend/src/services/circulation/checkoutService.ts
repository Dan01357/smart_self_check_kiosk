

// import { KohaSIP2Client, CheckoutResult } from '../koha/kohaSIP2Client';
// import { KohaDbClient } from '../koha/kohaDbClient';
// import { EASController } from '../../hardware/rfid/EASController';

// export class CheckoutService {
//   private sip2Client: KohaSIP2Client;
//   private kohaDb: KohaDbClient;
//   private easController: EASController;

//   constructor(easController: EASController) {
//     this.sip2Client = new KohaSIP2Client();
//     this.kohaDb = new KohaDbClient();
//     this.easController = easController;
//   }

//   /**
//    * Checkout items using RFID tags
//    */
//   async checkoutItems(
//     patronCardnumber: string,
//     rfidTags: string[]
//   ): Promise<CheckoutResult[]> {
//     const results: CheckoutResult[] = [];

//     for (const tag of rfidTags) {
//       try {
//         // 1. Convert RFID EPC to barcode
//         const barcode = await this.convertEPCToBarcode(tag);
        
//         if (!barcode) {
//           results.push({
//             success: false,
//             itemBarcode: tag,
//             dueDate: null,
//             message: 'Invalid RFID tag',
//             renewalsRemaining: 0,
//           });
//           continue;
//         }

//         // 2. Validate item status
//         const item = await this.kohaDb.getItemByBarcode(barcode);
        
//         if (!item) {
//           results.push({
//             success: false,
//             itemBarcode: barcode,
//             dueDate: null,
//             message: 'Item not found in system',
//             renewalsRemaining: 0,
//           });
//           continue;
//         }

//         // 3. Check if item can be checked out
//         if (item.notforloan > 0) {
//           results.push({
//             success: false,
//             itemBarcode: barcode,
//             dueDate: null,
//             message: 'Item is not available for loan',
//             renewalsRemaining: 0,
//           });
//           continue;
//         }

//         if (item.onloan) {
//           results.push({
//             success: false,
//             itemBarcode: barcode,
//             dueDate: null,
//             message: 'Item is already checked out',
//             renewalsRemaining: 0,
//           });
//           continue;
//         }

//         // 4. Perform checkout via SIP2
//         const checkoutResult = await this.sip2Client.checkout(
//           patronCardnumber,
//           barcode
//         );

//         // 5. Deactivate security tag (EAS) if checkout successful
//         if (checkoutResult.success) {
//           await this.easController.resetEASBit(tag);
//         }

//         results.push(checkoutResult);

//       } catch (error) {
//         console.error('Checkout error for tag:', tag, error);
//         results.push({
//           success: false,
//           itemBarcode: tag,
//           dueDate: null,
//           message: 'Checkout failed: ' + error.message,
//           renewalsRemaining: 0,
//         });
//       }
//     }

//     return results;
//   }

//   /**
//    * Convert RFID EPC to barcode
//    * This mapping should be configured based on your RFID tag encoding
//    */
//   private async convertEPCToBarcode(epc: string): Promise<string | null> {
//     try {
//       // Method 1: Direct mapping (if EPC contains barcode)
//       // Example: EPC = "3000" + barcode in hex
//       if (epc.startsWith('3000')) {
//         const barcodeHex = epc.substring(4);
//         const barcode = this.hexToString(barcodeHex);
//         return barcode;
//       }

//       // Method 2: Database lookup
//       const [rows] = await kohaDbPool.execute(
//         'SELECT barcode FROM items WHERE rfid_tag = ?',
//         [epc]
//       );
      
//       if ((rows as any[]).length > 0) {
//         return (rows as any[])[0].barcode;
//       }

//       return null;
//     } catch (error) {
//       console.error('EPC to barcode conversion error:', error);
//       return null;
//     }
//   }

//   private hexToString(hex: string): string {
//     let str = '';
//     for (let i = 0; i < hex.length; i += 2) {
//       const charCode = parseInt(hex.substr(i, 2), 16);
//       if (charCode > 0) {
//         str += String.fromCharCode(charCode);
//       }
//     }
//     return str.trim();
//   }
// }

