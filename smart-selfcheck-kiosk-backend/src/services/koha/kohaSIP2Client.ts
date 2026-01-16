
// import SIP2 from 'node-sip2';

// export interface CheckoutResult {
//   success: boolean;
//   itemBarcode: string;
//   dueDate: Date | null;
//   message: string;
//   renewalsRemaining: number;
// }

// export interface CheckinResult {
//   success: boolean;
//   itemBarcode: string;
//   message: string;
//   hasHold: boolean;
//   permanentLocation: string;
// }

// export class KohaSIP2Client {
//   private sipConnection: any;

//   constructor() {
//     this.sipConnection = new SIP2.Client({
//       host: process.env.KOHA_SIP_HOST || 'localhost',
//       port: parseInt(process.env.KOHA_SIP_PORT || '6001'),
//       username: process.env.KOHA_SIP_USERNAME,
//       password: process.env.KOHA_SIP_PASSWORD,
//       institutionId: process.env.KOHA_SIP_INSTITUTION || 'MAIN',
//       terminalPassword: process.env.KOHA_SIP_TERMINAL_PASSWORD,
//     });
//   }

//   /**
//    * Authenticate patron using SIP2
//    */
//   async authenticatePatron(
//     cardnumber: string,
//     password: string
//   ): Promise<boolean> {
//     try {
//       const response = await this.sipConnection.send(
//         new SIP2.Messages.PatronInformation(cardnumber, password)
//       );
      
//       return response.validPatron === 'Y' && response.validPatronPassword === 'Y';
//     } catch (error) {
//       console.error('SIP2 patron authentication error:', error);
//       return false;
//     }
//   }

//   /**
//    * Get patron status using SIP2 (23/24)
//    */
//   async getPatronStatus(cardnumber: string): Promise<any> {
//     try {
//       const response = await this.sipConnection.send(
//         new SIP2.Messages.PatronStatus(cardnumber)
//       );
      
//       return {
//         validPatron: response.validPatron === 'Y',
//         chargePrivilegesDenied: response.chargePrivilegesDenied === 'Y',
//         renewalPrivilegesDenied: response.renewalPrivilegesDenied === 'Y',
//         recallPrivilegesDenied: response.recallPrivilegesDenied === 'Y',
//         holdPrivilegesDenied: response.holdPrivilegesDenied === 'Y',
//         cardReportedLost: response.cardReportedLost === 'Y',
//         tooManyItemsCharged: response.tooManyItemsCharged === 'Y',
//         tooManyItemsOverdue: response.tooManyItemsOverdue === 'Y',
//         tooManyRenewals: response.tooManyRenewals === 'Y',
//         tooManyClaimsOfItemsReturned: response.tooManyClaimsOfItemsReturned === 'Y',
//         tooManyItemsLost: response.tooManyItemsLost === 'Y',
//         excessiveOutstandingFines: response.excessiveOutstandingFines === 'Y',
//         fineAmount: parseFloat(response.fineAmount) || 0,
//       };
//     } catch (error) {
//       console.error('SIP2 patron status error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Checkout item using SIP2 (11/12)
//    */
//   async checkout(
//     patronCardnumber: string,
//     itemBarcode: string,
//     scLocation: string = 'MAIN'
//   ): Promise<CheckoutResult> {
//     try {
//       const nbDueDate = new Date();
//       nbDueDate.setDate(nbDueDate.getDate() + 14); // Default 14-day loan

//       const response = await this.sipConnection.send(
//         new SIP2.Messages.Checkout(
//           patronCardnumber,
//           itemBarcode,
//           scLocation,
//           nbDueDate
//         )
//       );

//       return {
//         success: response.ok === '1',
//         itemBarcode: response.itemIdentifier,
//         dueDate: response.dueDate ? new Date(response.dueDate) : null,
//         message: response.screenMessage || '',
//         renewalsRemaining: parseInt(response.renewalsRemaining) || 0,
//       };
//     } catch (error) {
//       console.error('SIP2 checkout error:', error);
//       return {
//         success: false,
//         itemBarcode,
//         dueDate: null,
//         message: 'Checkout failed: ' + error.message,
//         renewalsRemaining: 0,
//       };
//     }
//   }

//   /**
//    * Checkin item using SIP2 (09/10)
//    */
//   async checkin(
//     itemBarcode: string,
//     returnDate: Date = new Date(),
//     currentLocation: string = 'MAIN'
//   ): Promise<CheckinResult> {
//     try {
//       const response = await this.sipConnection.send(
//         new SIP2.Messages.Checkin(
//           itemBarcode,
//           returnDate,
//           currentLocation,
//           '' // Item properties (optional)
//         )
//       );

//       return {
//         success: response.ok === '1',
//         itemBarcode: response.itemIdentifier,
//         message: response.screenMessage || '',
//         hasHold: response.alertType === '01', // 01 = hold
//         permanentLocation: response.permanentLocation || currentLocation,
//       };
//     } catch (error) {
//       console.error('SIP2 checkin error:', error);
//       return {
//         success: false,
//         itemBarcode,
//         message: 'Checkin failed: ' + error.message,
//         hasHold: false,
//         permanentLocation: currentLocation,
//       };
//     }
//   }

//   /**
//    * Get item information using SIP2 (17/18)
//    */
//   async getItemInformation(itemBarcode: string): Promise<any> {
//     try {
//       const response = await this.sipConnection.send(
//         new SIP2.Messages.ItemInformation(itemBarcode)
//       );

//       return {
//         itemIdentifier: response.itemIdentifier,
//         titleIdentifier: response.titleIdentifier,
//         mediaType: response.mediaType,
//         permanentLocation: response.permanentLocation,
//         currentLocation: response.currentLocation,
//         circulationStatus: response.circulationStatus,
//         feeType: response.feeType,
//         securityMarker: response.securityMarker,
//         dueDate: response.dueDate ? new Date(response.dueDate) : null,
//         holdQueueLength: parseInt(response.holdQueueLength) || 0,
//       };
//     } catch (error) {
//       console.error('SIP2 item information error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get patron information using SIP2 (63/64)
//    */
//   async getPatronInformation(cardnumber: string): Promise<any> {
//     try {
//       const response = await this.sipConnection.send(
//         new SIP2.Messages.PatronInformation(cardnumber)
//       );

//       return {
//         patronIdentifier: response.patronIdentifier,
//         personalName: response.personalName,
//         holdItemsCount: parseInt(response.holdItemsCount) || 0,
//         overdueItemsCount: parseInt(response.overdueItemsCount) || 0,
//         chargedItemsCount: parseInt(response.chargedItemsCount) || 0,
//         fineItemsCount: parseInt(response.fineItemsCount) || 0,
//         recallItemsCount: parseInt(response.recallItemsCount) || 0,
//         unavailableHoldsCount: parseInt(response.unavailableHoldsCount) || 0,
//         chargedItems: response.chargedItems || [],
//         fineItems: response.fineItems || [],
//         holdItems: response.holdItems || [],
//         overdueItems: response.overdueItems || [],
//         validPatron: response.validPatron === 'Y',
//         validPatronPassword: response.validPatronPassword === 'Y',
//         currencyType: response.currencyType,
//         feeAmount: parseFloat(response.feeAmount) || 0,
//         feeLimit: parseFloat(response.feeLimit) || 0,
//         screenMessage: response.screenMessage,
//         printLine: response.printLine,
//       };
//     } catch (error) {
//       console.error('SIP2 patron information error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Renew item using SIP2 (29/30)
//    */
//   async renew(
//     patronCardnumber: string,
//     itemBarcode: string
//   ): Promise<CheckoutResult> {
//     try {
//       const response = await this.sipConnection.send(
//         new SIP2.Messages.Renew(patronCardnumber, itemBarcode)
//       );

//       return {
//         success: response.ok === '1',
//         itemBarcode: response.itemIdentifier,
//         dueDate: response.dueDate ? new Date(response.dueDate) : null,
//         message: response.screenMessage || '',
//         renewalsRemaining: parseInt(response.renewalsRemaining) || 0,
//       };
//     } catch (error) {
//       console.error('SIP2 renew error:', error);
//       return {
//         success: false,
//         itemBarcode,
//         dueDate: null,
//         message: 'Renewal failed: ' + error.message,
//         renewalsRemaining: 0,
//       };
//     }
//   }
// }

