
// import { kohaDbPool } from '../../config/database.config';

// export interface KohaItem {
//   itemnumber: number;
//   biblionumber: number;
//   barcode: string;
//   itemcallnumber: string;
//   homebranch: string;
//   holdingbranch: string;
//   location: string;
//   itemlost: number;
//   withdrawn: number;
//   damaged: number;
//   notforloan: number;
//   onloan: string | null;          // Due date if checked out
// }

// export interface KohaBiblio {
//   biblionumber: number;
//   title: string;
//   author: string;
//   copyrightdate: string;
//   isbn: string;
// }

// export class KohaDbClient {
  
//   /**
//    * Get item by barcode
//    */
//   async getItemByBarcode(barcode: string): Promise<KohaItem | null> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT 
//         itemnumber, biblionumber, barcode, itemcallnumber,
//         homebranch, holdingbranch, location,
//         itemlost, withdrawn, damaged, notforloan, onloan
//       FROM items 
//       WHERE barcode = ? 
//       LIMIT 1`,
//       [barcode]
//     );
//     return (rows as any[])[0] || null;
//   }

//   /**
//    * Get biblio (book) information
//    */
//   async getBiblioById(biblionumber: number): Promise<KohaBiblio | null> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT 
//         biblionumber, title, author, copyrightdate,
//         (SELECT isbn FROM biblioitems WHERE biblionumber = biblio.biblionumber LIMIT 1) as isbn
//       FROM biblio 
//       WHERE biblionumber = ? 
//       LIMIT 1`,
//       [biblionumber]
//     );
//     return (rows as any[])[0] || null;
//   }

//   /**
//    * Check if item is currently checked out
//    */
//   async isItemCheckedOut(barcode: string): Promise<boolean> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT COUNT(*) as count 
//       FROM issues 
//       WHERE itemnumber = (SELECT itemnumber FROM items WHERE barcode = ?)`,
//       [barcode]
//     );
//     return (rows as any[])[0].count > 0;
//   }

//   /**
//    * Get current checkout info
//    */
//   async getCurrentCheckout(barcode: string): Promise<any> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT 
//         i.issue_id,
//         i.borrowernumber,
//         i.itemnumber,
//         i.date_due,
//         i.issuedate,
//         i.renewals,
//         b.surname,
//         b.firstname,
//         b.cardnumber
//       FROM issues i
//       JOIN borrowers b ON i.borrowernumber = b.borrowernumber
//       WHERE i.itemnumber = (SELECT itemnumber FROM items WHERE barcode = ?)
//       LIMIT 1`,
//       [barcode]
//     );
//     return (rows as any[])[0] || null;
//   }

//   /**
//    * Check if item has holds
//    */
//   async hasHolds(biblionumber: number): Promise<boolean> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT COUNT(*) as count 
//       FROM reserves 
//       WHERE biblionumber = ? 
//       AND found IS NULL`,
//       [biblionumber]
//     );
//     return (rows as any[])[0].count > 0;
//   }

//   /**
//    * Get hold information
//    */
//   async getHoldInfo(biblionumber: number): Promise<any> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT 
//         r.reserve_id,
//         r.borrowernumber,
//         r.biblionumber,
//         r.branchcode,
//         r.reservedate,
//         r.priority,
//         b.surname,
//         b.firstname,
//         b.cardnumber
//       FROM reserves r
//       JOIN borrowers b ON r.borrowernumber = b.borrowernumber
//       WHERE r.biblionumber = ? 
//       AND r.found IS NULL
//       ORDER BY r.priority
//       LIMIT 1`,
//       [biblionumber]
//     );
//     return (rows as any[])[0] || null;
//   }

//   /**
//    * Get patron's current checkouts
//    */
//   async getPatronCheckouts(borrowernumber: number): Promise<any[]> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT 
//         i.issue_id,
//         i.itemnumber,
//         i.date_due,
//         i.issuedate,
//         i.renewals,
//         it.barcode,
//         b.title,
//         b.author
//       FROM issues i
//       JOIN items it ON i.itemnumber = it.itemnumber
//       JOIN biblio b ON it.biblionumber = b.biblionumber
//       WHERE i.borrowernumber = ?
//       ORDER BY i.date_due ASC`,
//       [borrowernumber]
//     );
//     return rows as any[];
//   }

//   /**
//    * Get patron's holds
//    */
//   async getPatronHolds(borrowernumber: number): Promise<any[]> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT 
//         r.reserve_id,
//         r.biblionumber,
//         r.branchcode,
//         r.reservedate,
//         r.waitingdate,
//         r.found,
//         b.title,
//         b.author
//       FROM reserves r
//       JOIN biblio b ON r.biblionumber = b.biblionumber
//       WHERE r.borrowernumber = ?
//       ORDER BY r.priority ASC`,
//       [borrowernumber]
//     );
//     return rows as any[];
//   }

//   /**
//    * Calculate overdue fines
//    */
//   async calculateOverdueFines(borrowernumber: number): Promise<number> {
//     const [rows] = await kohaDbPool.execute(
//       `SELECT SUM(amountoutstanding) as total
//       FROM accountlines
//       WHERE borrowernumber = ?
//       AND accounttype IN ('OVERDUE', 'FU')`,
//       [borrowernumber]
//     );
//     return (rows as any[])[0]?.total || 0;
//   }

//   /**
//    * Get item's circulation status
//    * 0 = Available, 1 = Checked out, 2 = On hold, etc.
//    */
//   async getCirculationStatus(barcode: string): Promise<number> {
//     const item = await this.getItemByBarcode(barcode);
    
//     if (!item) return -1; // Not found
    
//     if (item.itemlost > 0) return 3; // Lost
//     if (item.withdrawn > 0) return 4; // Withdrawn
//     if (item.damaged > 0) return 5; // Damaged
//     if (item.notforloan > 0) return 6; // Not for loan
//     if (item.onloan) return 1; // Checked out
    
//     // Check if on hold
//     const hasHolds = await this.hasHolds(item.biblionumber);
//     if (hasHolds) return 2; // On hold
    
//     return 0; // Available
//   }
// }

