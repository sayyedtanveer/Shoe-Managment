// @ts-ignore
import PDFDocument from 'pdfkit';
// @ts-ignore
import qrcode from 'qrcode';
import prisma from '@infrastructure/database/prisma';
import { BadRequestError, NotFoundError } from '@core/ApiError';

export class QrService {
    async generateForVariants(
        shopId: string,
        variantIds: string[]
    ): Promise<{ variantId: string; qrDataUrl: string }[]> {
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds }, shopId },
            include: { product: true },
        });

        if (variants.length !== variantIds.length) {
            throw new NotFoundError('One or more variants not found for this shop');
        }

        const results: { variantId: string; qrDataUrl: string }[] = [];
        for (const v of variants) {
            const dataUrl = await qrcode.toDataURL(v.id);
            results.push({ variantId: v.id, qrDataUrl: dataUrl });
        }
        return results;
    }

    async generatePdfForVariants(shopId: string, ids: string[]): Promise<Buffer> {
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: ids }, shopId },
            include: { product: true },
        });
        if (variants.length === 0) {
            throw new BadRequestError('No variants found for given ids');
        }

        const doc = new PDFDocument({ size: 'A4', margin: 36 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));

        const cols = 2;
        const rows = 4;
        const labelWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / cols;
        const labelHeight = (doc.page.height - doc.page.margins.top - doc.page.margins.bottom) / rows;

        let index = 0;
        for (const v of variants) {
            const col = index % cols;
            const row = Math.floor(index / cols) % rows;

            if (index > 0 && row === 0 && col === 0) {
                doc.addPage();
            }

            const x = doc.page.margins.left + col * labelWidth;
            const y = doc.page.margins.top + row * labelHeight;

            doc.rect(x + 4, y + 4, labelWidth - 8, labelHeight - 8).stroke('#cccccc');

            doc.fontSize(10).text(v.product.model, x + 12, y + 12, {
                width: labelWidth - 24,
            });
            doc.fontSize(9).text(`Size: ${v.size ?? '-'}`, x + 12, y + 28);
            doc.fontSize(9).text(`Color: ${v.color ?? '-'}`, x + 12, y + 40);
            if (v.product.sellingPrice) {
                doc.fontSize(11).text(`₹${v.product.sellingPrice.toString()}`, x + 12, y + 56);
            }

            const qrPng = await qrcode.toBuffer(v.id, { margin: 1, width: 96 });
            doc.image(qrPng, x + labelWidth - 120, y + 20, { width: 96, height: 96 });

            index += 1;
        }

        doc.end();

        return await new Promise<Buffer>((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });
    }
}

