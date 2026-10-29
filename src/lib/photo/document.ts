import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

const W = 595.28;
const H = 841.89;
const LEFT = 42;
const RIGHT = W - 42;
const INK = rgb(0.11, 0.09, 0.07);
const MUTED = rgb(0.33, 0.29, 0.24);
const GOLD = rgb(0.62, 0.46, 0.18);
const PAPER = rgb(0.97, 0.95, 0.91);
const BAND = rgb(0.11, 0.09, 0.07);
const WHITE = rgb(0.97, 0.95, 0.91);

const TERMS = `Terms and Conditions - Photography Services Agreement

FutureT3ch is an IT and Photography Service Business. This Content Agreement (the "Agreement") is between J Cilia and T.A Nguyen ABN 26 693 354 742 trading as FUTURET3CH and you (the "Client").

Please read this document carefully. It describes the terms of engagement of services by FutureT3ch. You are deemed to have read and accepted these terms by continuing to accept and engage the services of FutureT3ch.

Please contact us at admin@futuret3ch.com.au if you have any questions about this Agreement.

1. Services
1.1 FutureT3ch offers an extensive range of photography services. Please refer to your invoice to confirm the inclusions to which these terms apply.
1.2 The current core services are as stated but are not limited to the following:
1.2.1 Per image photography.
1.2.2 Full-day photo shoot - approximately 8 hours.
1.2.3 Half-day photo shoot - approximately 4 hours.
1.2.5 The fees described above are for use on your digital platforms only.
1.2.6 Express permission and additional licence fees apply for the use of images in print and other media advertising.
1.2.7 For further permissions and licence information, contact jason.c@futuret3ch.com.au or admin@futuret3ch.com.au.

2. Pricing and Payment
2.1 All prices for services and all payment plans offered by FutureT3ch exclude GST.
2.2 All services are invoiced directly to you. Please refer to your invoice for the selected services.
2.3 Half-day and full-day photoshoots. A 50% non-refundable deposit is required to confirm your booking. Re-shoot fees will require a call-out fee. Extra costs for a model, styling or sourcing, deep etching and complex retouching will be confirmed at the time of the request.
2.4 Payment for all services is accepted by bank transfer and credit card.
2.5 Credit card payments incur a merchant fee of 1.75%, which will be shown on the invoice.
2.6 We reserve the right to change service offerings and prices at any time. Check the website or email admin@futuret3ch.com.au.
2.7 Full payment must be made before the shoot.
2.8 Urgent requests. FutureT3ch reserves the right to charge a fee of up to a 50% premium on any service requested on an urgent basis.
2.9 File retrieval. FutureT3ch reserves the right to charge $100.00 to process any file retrieval request received 90 days after the booked photoshoot.

3. Booking Your Photography Shoot
3.1 All bookings are confirmed by you via email and must include your contact details or your company representative's details (mobile, email and ABN) and payment notification of the required deposit.
3.2 Product photography. All products required for the photoshoot must be ready to be photographed.
3.3 While FutureT3ch will exercise the utmost care, some products may be opened or damaged during the creative process.
3.4 Additional charges may apply to cover the return cost of the products.
3.5 Products can be stored for up to 14 days after the shoot.
3.6 You are responsible for collecting the products or arranging return shipping within 14 days.
3.7 Unclaimed products will be disposed of after 14 days, at our discretion.
3.8 All content and products must be provided before the photoshoot. Failure to provide them on time will result in a reschedule.
3.9 FutureT3ch does not guarantee that a requested reschedule date will be available.
3.10 FutureT3ch is not responsible for late delivery caused by the Client.
3.11 All communication about bookings is by email only.
3.12 FutureT3ch will not be responsible for communication by any other method.
3.14 Any request to reschedule must be made in writing.
3.15 A request made more than seven days before the photoshoot may be rescheduled without a fee.
3.16 A request made within seven days of the photoshoot incurs a reschedule fee of $350.
3.17 Every effort will be made to accommodate a preferred date. It is not guaranteed.
3.18 From time to time FutureT3ch may need to reschedule. A mutually convenient date will be negotiated.
3.19 A model release and/or parental consent may be required and, on request, must be provided at the time of payment.

4. Delivery
4.1 Image proofs are provided within seven to ten working days of the photoshoot.
4.2 After approval of the proof sheet and payment of any balance, final images are delivered within seven working days.

5. Amendments and Revisions
5.1 FutureT3ch will provide one round of revision of images that do not conform to the client brief.
5.2 Additional fees apply where the Client requests further changes after that revision.
5.3 Additional work is invoiced at an hourly rate set at the time of the request.

6. Refund and Cancellation
6.1 FutureT3ch does not offer refunds for professional services.
6.2 There is no refund for a change of mind.
6.3 Where a Client is genuinely unhappy and gives reasonable, detailed reasons tied to the brief, a re-shoot may be offered entirely at our discretion, at no extra cost.
6.4 Where a re-shoot is declined, there is no refund.
6.5 Where a re-shoot is declined, the Client may use the images provided.
6.6 Cancellation must be notified in writing by email with 72 hours' notice.
6.7 The 50% deposit paid at booking is non-refundable.
6.8 There is no refund at any time for a change of mind.
6.9 There is no refund if you fail to meet your obligations under these terms.

7. Intellectual Property and Usage
7.1 All content, including proofs, digital files, printed images and documents, is the exclusive property of FutureT3ch.
7.2 FutureT3ch grants the Client a non-exclusive, restricted and perpetual licence for business use only.
7.3 Digital files may be used only in accordance with this agreement.
7.4 The Client shall not submit images to competitions or exhibitions, modify them, reproduce them for commercial use, or authorise reproductions by anyone other than FutureT3ch.
7.5 The Client must not use the images for other commercial purposes, including out-of-home advertising, commercial television, print campaigns or third-party use, unless a licence or assignment is agreed.
7.6 Licence enquiries: email FutureT3ch.
7.7 If a digital file print release is provided, the Client must follow that release.
7.8 High-resolution images are for business use only.
7.9 The Client shall not copy, download, screenshot, share or otherwise capture the photographs except as this agreement allows.
7.10 FutureT3ch retains the right to select which images are released.
7.11 FutureT3ch may include finished images in its professional marketing and portfolio.
7.12 No licence is granted to any third party.
7.13 Third-party use is prohibited unless approved in writing.
7.14 Written permission may be requested by email.

8. Termination
8.1 FutureT3ch will complete the brief with due skill, provided you meet your obligations.
8.2 FutureT3ch may terminate a brief if there is an evident lack of commitment. You will be notified in writing and termination is immediate. You remain liable for fees for work done. Completed files transfer on payment of outstanding fees. Incomplete files are not transferred.

9. Feedback and Disputes
9.1 Contact FutureT3ch immediately with any concern so it can be resolved.
9.2 Advise FutureT3ch in writing of the nature of the dispute, the outcome you seek, and what will settle it.
9.3 The parties will meet in person or by video, in good faith, to resolve the dispute.
9.4 If no agreement is reached, either party may refer the dispute to an accredited mediator appointed by the Law Institute of Victoria.
9.5 Both parties must attend mediation in good faith.
9.6 Litigation may only be considered after a genuine attempt at mediation is unsuccessful.
9.7 Confidentiality is paramount. Communications and discussions will not be made public, including on social media.
9.8 Public comments that are defamatory, harmful or damaging may be the subject of compensation.

10. Limitation of Liability
10.1 Liability is governed by the Australian Consumer Law and these terms.
10.2 Nothing in these terms removes your statutory rights.
10.3 Except for those rights, services are provided without warranties of any kind, either express or implied.
10.4 FutureT3ch disclaims implied warranties of merchantability and fitness for a particular purpose, to the extent the law allows.
10.5 FutureT3ch is not liable for damages that may arise from the use of images, beyond what the law requires.
10.6 Services are supplied with due care and skill and are fit for the purpose advertised.
10.7 Where liability cannot be excluded, it is limited to resupplying the services or, at FutureT3ch's option, refunding the amount paid for the services the claim relates to.
10.8 FutureT3ch shall be held harmless for injury to the Client, attending parties, and property damage during the photography session and the immediately surrounding events, to the extent the law allows.

11. Governing Law
11.1 These terms are governed by the laws of the State of Victoria, Australia.
11.2 Each party submits to the exclusive jurisdiction of the State of Victoria.

By proceeding with payment and engagement of FutureT3ch's services, you confirm that you have read, understood and agreed to these terms.

Additional notes. Photos are charged per photo plus editing, contact management, travel and any additional equipment. Photos are placed in a Google Drive link. Deposit: 50%, non-refundable, to confirm the booking.`;

type QuoteSheet = {
  kind: "Quote";
  client: string;
  email: string;
  hours: number;
  rate: number;
  expenses: number;
  tax: number;
  gross: number;
  due: number;
  deposit: number;
};

export type BookingSheet = {
  kind: "Booking";
  client: string;
  email: string;
  service: string;
  date: string;
  time: string;
  note: string;
};

class Sheet {
  private pdf!: PDFDocument;
  private font!: PDFFont;
  private bold!: PDFFont;
  private logo: PDFImage | null = null;
  private page!: PDFPage;
  private y = 0;
  private pages: PDFPage[] = [];

  static async open() {
    const sheet = new Sheet();
    sheet.pdf = await PDFDocument.create();
    sheet.font = await sheet.pdf.embedFont(StandardFonts.Helvetica);
    sheet.bold = await sheet.pdf.embedFont(StandardFonts.HelveticaBold);
    try {
      const response = await fetch("/brand/t3x.jpg");
      if (response.ok) sheet.logo = await sheet.pdf.embedJpg(await response.arrayBuffer());
    } catch {
      sheet.logo = null;
    }
    sheet.addPage();
    return sheet;
  }

  private addPage() {
    this.page = this.pdf.addPage([W, H]);
    this.pages.push(this.page);
    this.page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: INK, borderWidth: 1.25 });
    this.page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: GOLD, borderWidth: 0.6 });
    this.drawHead();
  }

  private drawHead() {
    const top = H - 40;
    if (this.logo) {
      const height = 78;
      const width = (this.logo.width / this.logo.height) * height;
      this.page.drawImage(this.logo, { x: LEFT, y: top - height + 8, width, height });
    }
    const textX = this.logo ? LEFT + 108 : LEFT;
    this.page.drawText("FUTURET3CH", { x: textX, y: top - 6, size: 16, font: this.bold, color: INK });
    this.page.drawText("J CILIA & T.A NGUYEN", { x: textX, y: top - 24, size: 9, font: this.bold, color: INK });
    this.page.drawText("Business name: futuret3ch", { x: textX, y: top - 38, size: 8, font: this.font, color: MUTED });
    this.page.drawText("ABN 26 693 354 742", { x: textX, y: top - 50, size: 8, font: this.bold, color: INK });
    this.page.drawText("futuret3ch.com.au", { x: textX, y: top - 64, size: 8, font: this.font, color: MUTED });
    this.page.drawText("t3x.futuret3ch.com.au", { x: textX, y: top - 76, size: 8, font: this.font, color: MUTED });
    this.page.drawLine({ start: { x: LEFT, y: top - 90 }, end: { x: RIGHT, y: top - 90 }, thickness: 0.8, color: GOLD });
    this.y = top - 108;
  }

  private gap(n: number) {
    this.y -= n;
  }

  private need(height: number) {
    if (this.y - height < 52) this.addPage();
  }

  title(label: string) {
    this.need(28);
    this.page.drawRectangle({ x: LEFT, y: this.y - 6, width: RIGHT - LEFT, height: 22, color: BAND });
    this.page.drawText(label, { x: LEFT + 8, y: this.y, size: 11, font: this.bold, color: WHITE });
    this.y -= 28;
  }

  row(label: string, value: string, strong = false) {
    this.need(18);
    this.page.drawRectangle({
      x: LEFT,
      y: this.y - 5,
      width: RIGHT - LEFT,
      height: 18,
      borderColor: rgb(0.82, 0.78, 0.7),
      borderWidth: 0.4,
      color: strong ? rgb(0.95, 0.91, 0.84) : PAPER,
    });
    this.page.drawText(label, { x: LEFT + 8, y: this.y, size: 9, font: this.font, color: MUTED });
    const face = strong ? this.bold : this.font;
    const width = face.widthOfTextAtSize(value, 9);
    this.page.drawText(value, { x: RIGHT - 8 - width, y: this.y, size: 9, font: face, color: INK });
    this.y -= 18;
  }

  note(text: string) {
    this.paragraph(text, 8, MUTED);
  }

  heading(text: string) {
    this.need(18);
    this.gap(6);
    this.page.drawText(text, { x: LEFT, y: this.y, size: 10, font: this.bold, color: INK });
    this.y -= 14;
  }

  paragraph(text: string, size = 8.5, color = INK) {
    const max = RIGHT - LEFT;
    const words = text.split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (this.font.widthOfTextAtSize(next, size) > max && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    for (const item of lines) {
      this.need(size + 3);
      this.page.drawText(item, { x: LEFT, y: this.y, size, font: this.font, color });
      this.y -= size + 3;
    }
  }

  terms() {
    this.gap(8);
    this.title("TERMS AND CONDITIONS");
    for (const block of TERMS.split("\n")) {
      const line = block.trim();
      if (!line) {
        this.gap(4);
        continue;
      }
      if (/^\d+\.\s/.test(line) && line.length < 48) this.heading(line);
      else if (line.startsWith("Terms and Conditions")) this.heading(line);
      else this.paragraph(line);
    }
  }

  async bytes() {
    this.pages.forEach((page, index) => {
      const label = `FutureT3ch  |  ABN 26 693 354 742  |  Page ${index + 1} of ${this.pages.length}`;
      const width = this.font.widthOfTextAtSize(label, 7);
      page.drawText(label, { x: (W - width) / 2, y: 34, size: 7, font: this.font, color: MUTED });
    });
    return this.pdf.save();
  }
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export async function quotePdfBlob(sheet: QuoteSheet | BookingSheet) {
  const doc = await Sheet.open();
  const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  if (sheet.kind === "Quote") {
    doc.title("QUOTE");
    doc.row("Date", today);
    doc.row("Client", sheet.client.trim() || "To be named");
    doc.row("Client email", sheet.email.trim() || "Not yet given");
    doc.row("Hours", String(sheet.hours));
    doc.row("Day rate portion", money(sheet.rate));
    doc.row("Expenses", money(sheet.expenses));
    doc.row("Tax", `${sheet.tax}%`);
    doc.row("Quote", money(sheet.gross), true);
    doc.row("Deposit " + sheet.deposit + "%", money(sheet.due), true);
    doc.row("Balance after deposit", money(Math.max(0, sheet.gross - sheet.due)));
    doc.note("Deposit: 50%, non-refundable, to confirm the booking. Prices exclude GST unless a tax amount is shown. A credit card payment adds a 1.75% merchant fee. Full payment is due before the shoot.");
    doc.note("Websites: futuret3ch.com.au and t3x.futuret3ch.com.au. Email: admin@futuret3ch.com.au and Tammy.n@futuret3ch.com.au.");
  } else {
    doc.title("BOOKING REQUEST");
    doc.row("Date", today);
    doc.row("Name", sheet.client.trim() || "To be named");
    doc.row("Email", sheet.email.trim() || "Not yet given");
    doc.row("Service", sheet.service);
    doc.row("Preferred date", sheet.date || "To be agreed");
    doc.row("Preferred time", sheet.time);
    doc.note(sheet.note.trim() || "No notes added.");
    doc.note("Deposit: 50%, non-refundable, to confirm the booking. A time, and Tammy quotes you in person.");
    doc.note("futuret3ch.com.au  |  t3x.futuret3ch.com.au  |  ABN 26 693 354 742");
  }
  doc.terms();
  const bytes = await doc.bytes();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}
