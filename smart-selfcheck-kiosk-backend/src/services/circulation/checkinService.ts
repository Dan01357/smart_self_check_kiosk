
// import { KohaSIP2Client, CheckinResult } from '../koha/kohaSIP2Client';
// import { KohaDbClient } from '../koha/kohaDbClient';
// import { EASController } from '../../hardware/rfid/EASController';

// export class CheckinService {
//   private sip2Client: KohaSIP2Client;
//   private kohaDb: KohaDbClient;
//   private easController: EASController;

//   constructor(easController: EASController) {
//     this.sip2Client = new KohaSIP2Client();
//     this.kohaDb = new KohaDbClient();
//     this.easController = easController;
//   }

//   /**
//    * Return items using RFID tags
//    */
//   async checkinItems(rfidTags: string[]): Promise<CheckinResult[]> {
//     const results: CheckinResult[] = [];

//     for (const tag of rfidTags) {
//       try {
//         // 1. Convert RFID EPC to barcode
//         const barcode = await this.convertEPCToBarcode(tag);
        
//         if (!barcode) {
//           results.push({
//             success: false,
//             itemBarcode: tag,
//             message: 'Invalid RFID tag',
//             hasHold: false,
//             permanentLocation: '',
//           });
//           continue;
//         }

//         // 2. Get item info
//         const item = await this.kohaDb.getItemByBarcode(barcode);
        
//         if (!item) {
//           results.push({
//             success: false,
//             itemBarcode: barcode,
//             message: 'Item not found in system',
//             hasHold: false,
//             permanentLocation: '',
//           });
//           continue;
//         }

//         // 3. Check current checkout status
//         const checkout = await this.kohaDb.getCurrentCheckout(barcode);
        
//         if (!checkout) {
//           results.push({
//             success: false,
//             itemBarcode: barcode,
//             message: 'Item is not checked out',
//             hasHold: false,
//             permanentLocation: item.homebranch,
//           });
//           continue;
//         }

//         // 4. Perform checkin via SIP2
//         const checkinResult = await this.sip2Client.checkin(
//           barcode,
//           new Date(),
//           item.holdingbranch
//         );

//         // 5. Reactivate security tag (EAS)
//         await this.easController.setEASBit(tag);

//         // 6. Check if item has holds
//         const hasHolds = await this.kohaDb.hasHolds(item.biblionumber);
        
//         if (hasHolds) {
//           const holdInfo = await this.kohaDb.getHoldInfo(item.biblionumber);
//           checkinResult.hasHold = true;
//           checkinResult.message = `Item has hold for: ${holdInfo.surname}, ${holdInfo.firstname}`;
//         }

//         // 7. Calculate fines if overdue
//         if (checkout.date_due < new Date()) {
//           const fines = await this.kohaDb.calculateOverdueFines(
//             checkout.borrowernumber
//           );
          
//           if (fines > 0) {
//             checkinResult.message += ` | Late fee: $${fines.toFixed(2)}`;
//           }
//         }

//         results.push(checkinResult);

//       } catch (error) {
//         console.error('Checkin error for tag:', tag, error);
//         results.push({
//           success: false,
//           itemBarcode: tag,
//           message: 'Return failed: ' + error.message,
//           hasHold: false,
//           permanentLocation: '',
//         });
//       }
//     }

//     return results;
//   }

//   private async convertEPCToBarcode(epc: string): Promise<string | null> {
//     // Same implementation as CheckoutService
//     return null;
//   }
// }

