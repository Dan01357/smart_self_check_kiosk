
import escpos from 'escpos';
// @ts-ignore
import USB from 'escpos-usb';

export class ThermalPrinter {
  private device: any;
  private printer: any;

  constructor() {
    // Initialize USB connection
    this.device = new USB();
  }

  /**
   * Print checkout receipt
   */
  async printCheckoutReceipt(data: {
    patronName: string;
    checkoutDate: Date;
    items: Array<{
      title: string;
      barcode: string;
      dueDate: Date;
    }>;
  }): Promise<void> {
    try {
      this.printer = new escpos.Printer(this.device);

      await this.device.open(async () => {
        this.printer
          .font('a')
          .align('ct')
          .size(2, 2)
          .text('Library Receipt')
          .size(1, 1)
          .text('--------------------------------')
          .align('lt')
          .text(`Patron: ${data.patronName}`)
          .text(`Date: ${data.checkoutDate.toLocaleDateString()}`)
          .text('--------------------------------')
          .text('Items Checked Out:')
          .text('');

        data.items.forEach((item, index) => {
          this.printer
            .text(`${index + 1}. ${item.title}`)
            .text(`   Barcode: ${item.barcode}`)
            .text(`   Due: ${item.dueDate.toLocaleDateString()}`)
            .text('');
        });

        this.printer
          .text('--------------------------------')
          .align('ct')
          .text('Thank you for using our library!')
          .text('Please return items on time')
          .cut()
          .close();
      });
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  /**
   * Print return receipt
   */
  async printReturnReceipt(data: {
    patronName: string;
    returnDate: Date;
    items: Array<{
      title: string;
      barcode: string;
      wasOverdue: boolean;
      fine: number;
    }>;
    totalFine: number;
  }): Promise<void> {
    try {
      this.printer = new escpos.Printer(this.device);

      await this.device.open(async () => {
        this.printer
          .font('a')
          .align('ct')
          .size(2, 2)
          .text('Return Receipt')
          .size(1, 1)
          .text('--------------------------------')
          .align('lt')
          .text(`Patron: ${data.patronName}`)
          .text(`Date: ${data.returnDate.toLocaleDateString()}`)
          .text('--------------------------------')
          .text('Items Returned:')
          .text('');

        data.items.forEach((item, index) => {
          this.printer
            .text(`${index + 1}. ${item.title}`)
            .text(`   Barcode: ${item.barcode}`);
          
          if (item.wasOverdue) {
            this.printer.text(`   ** OVERDUE - Fine: $${item.fine.toFixed(2)} **`);
          }
          
          this.printer.text('');
        });

        if (data.totalFine > 0) {
          this.printer
            .text('--------------------------------')
            .size(1, 2)
            .text(`Total Fine: $${data.totalFine.toFixed(2)}`)
            .size(1, 1)
            .text('Please pay at circulation desk');
        }

        this.printer
          .text('--------------------------------')
          .align('ct')
          .text('Thank you!')
          .cut()
          .close();
      });
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }
}

