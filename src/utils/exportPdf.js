import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a professional PDF report from investment calculator data
 * @param {Object} params - Parameters for the PDF
 * @param {Object} params.inputs - User input values
 * @param {Object} params.results - Calculated results
 * @param {number} params.itpRate - ITP tax rate
 * @param {HTMLElement} params.chartElement - Chart DOM element to capture
 */
export async function generateInvestmentPDF({ inputs, results, itpRate, chartElement }) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Colors - Zona3 brand
    const primaryColor = [196, 81, 61]; // #c4513d
    const darkColor = [45, 45, 45]; // #2d2d2d
    const grayColor = [102, 102, 102]; // #666
    const greenColor = [90, 125, 90]; // #5a7d5a
    const redColor = [220, 38, 38]; // #dc2626

    // Helper functions
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatPercent = (value, decimals = 1) => {
        return `${(value * 100).toFixed(decimals)}%`;
    };

    const formatNumber = (value, decimals = 2) => {
        return value.toFixed(decimals);
    };

    const addLine = (startX, endX, y) => {
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.5);
        pdf.line(startX, y, endX, y);
    };

    // =====================
    // HEADER
    // =====================
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Calculadora de Rentabilidad', margin, 18);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Informe de Inversión Inmobiliaria', margin, 27);

    // Date on right side
    const today = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    pdf.setFontSize(10);
    pdf.text(today, pageWidth - margin, 27, { align: 'right' });

    yPos = 50;

    // =====================
    // PROPERTY INFO
    // =====================
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Datos de la Propiedad', margin, yPos);
    addLine(margin, pageWidth - margin, yPos + 3);
    yPos += 12;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const propertyData = [
        ['Dirección:', inputs.direccion],
        ['Comunidad:', `${inputs.comunidad} (ITP: ${formatPercent(itpRate, 1)})`],
    ];

    propertyData.forEach(([label, value]) => {
        pdf.setTextColor(...grayColor);
        pdf.text(label, margin, yPos);
        pdf.setTextColor(...darkColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, margin + 35, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 6;
    });

    yPos += 8;

    // =====================
    // INPUT SUMMARY - Two columns
    // =====================
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Datos de Entrada', margin, yPos);
    addLine(margin, pageWidth - margin, yPos + 3);
    yPos += 12;

    const colWidth = (pageWidth - 2 * margin - 10) / 2;

    const leftColInputs = [
        ['Precio de compra:', formatCurrency(inputs.precioCompra)],
        ['Gastos (Notaría, etc.):', formatCurrency(inputs.gastos)],
        ['Gastos hipoteca:', formatCurrency(inputs.gastosHipoteca)],
        ['Coste reforma:', formatCurrency(inputs.costeReforma)],
        ['Comisión:', formatCurrency(inputs.comision)],
        ['Mobiliario:', formatCurrency(inputs.mobiliario)],
        ['Impuesto ITP:', formatCurrency(results.impuestoITP)],
    ];

    const rightColInputs = [
        ['Cuota alquiler mensual:', formatCurrency(inputs.cuotaAlquiler)],
        ['Revalorización anual:', formatPercent(inputs.revalorizacion)],
        ['% Financiado:', formatPercent(inputs.porcentajeFinanciado)],
        ['Plazo hipoteca:', `${inputs.plazoHipoteca} años`],
        ['Tipo de interés:', formatPercent(inputs.tipoInteres)],
        ['Gastos anuales:', formatCurrency(results.totalGastosAnual)],
    ];

    pdf.setFontSize(9);
    const startY = yPos;

    leftColInputs.forEach(([label, value], idx) => {
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, margin, yPos);
        pdf.setTextColor(...darkColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, margin + colWidth - 5, yPos, { align: 'right' });
        yPos += 5.5;
    });

    yPos = startY;
    const rightX = margin + colWidth + 10;

    rightColInputs.forEach(([label, value], idx) => {
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, rightX, yPos);
        pdf.setTextColor(...darkColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5.5;
    });

    yPos = startY + Math.max(leftColInputs.length, rightColInputs.length) * 5.5 + 10;

    // Total de compra - Highlighted
    pdf.setFillColor(250, 248, 245);
    pdf.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, 10, 2, 2, 'F');
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL COMPRA:', margin + 5, yPos + 2);
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(12);
    pdf.text(formatCurrency(results.totalCompra), pageWidth - margin - 5, yPos + 2, { align: 'right' });

    yPos += 18;

    // =====================
    // KPIs SECTION
    // =====================
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KPIs de Rentabilidad', margin, yPos);
    addLine(margin, pageWidth - margin, yPos + 3);
    yPos += 12;

    const kpis = [
        {
            name: 'Rentabilidad Bruta',
            value: formatPercent(results.rentabilidadBruta, 1),
            isGood: results.rentabilidadBruta > 0,
            highlight: true
        },
        {
            name: 'Rentabilidad Neta',
            value: formatPercent(results.rentabilidadNeta, 1),
            isGood: results.rentabilidadNeta > 0,
            highlight: true
        },
        {
            name: 'Cash-Flow Mensual',
            value: formatCurrency(results.cashFlowMensual),
            isGood: results.cashFlowMensual >= 0,
            highlight: true
        },
        { name: 'PER', value: formatNumber(results.per, 2), isGood: results.per > 0 && results.per < 15 },
        { name: '% Hipoteca / Alquiler', value: formatPercent(results.porcentajeHipotecaAlquiler, 1), isGood: results.porcentajeHipotecaAlquiler < 0.5 },
        { name: 'Cash-Flow / Alquiler', value: formatPercent(results.cashFlowAlquiler, 1), isGood: results.cashFlowAlquiler > 0 },
        { name: 'Cash on Cash', value: formatPercent(results.cashOnCash, 1), isGood: results.cashOnCash > 0 },
        { name: 'ROCE', value: formatPercent(results.roce, 2), isGood: results.roce > 0, highlight: true },
        { name: 'Rentabilidad Total', value: formatPercent(results.rentabilidadTotal, 2), isGood: results.rentabilidadTotal > 0, highlight: true },
    ];

    // KPIs in 3-column grid
    const kpiColWidth = (pageWidth - 2 * margin - 10) / 3;
    const kpiHeight = 18;
    let kpiX = margin;
    let kpiY = yPos;

    kpis.forEach((kpi, idx) => {
        if (idx % 3 === 0 && idx !== 0) {
            kpiX = margin;
            kpiY += kpiHeight + 5;
        }

        // KPI box
        if (kpi.highlight) {
            pdf.setFillColor(250, 248, 245);
        } else {
            pdf.setFillColor(255, 255, 255);
        }
        pdf.setDrawColor(224, 216, 208);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(kpiX, kpiY, kpiColWidth - 3, kpiHeight, 2, 2, 'FD');

        // KPI label
        pdf.setTextColor(...grayColor);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.name.toUpperCase(), kpiX + 3, kpiY + 5);

        // KPI value
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(kpi.isGood ? greenColor[0] : redColor[0], kpi.isGood ? greenColor[1] : redColor[1], kpi.isGood ? greenColor[2] : redColor[2]);
        pdf.text(kpi.value, kpiX + 3, kpiY + 13);

        kpiX += kpiColWidth + 2;
    });

    yPos = kpiY + kpiHeight + 15;

    // =====================
    // FINANCING DETAILS
    // =====================
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detalle de Financiación', margin, yPos);
    addLine(margin, pageWidth - margin, yPos + 3);
    yPos += 10;

    const financeData = [
        ['Capital a aportar:', formatCurrency(results.capitalAportar)],
        ['Hipoteca:', formatCurrency(results.hipoteca)],
        ['Cuota hipoteca:', `${formatCurrency(results.cuotaHipotecaMensual)} / mes`],
        ['Cuota hipoteca anual:', formatCurrency(results.cuotaHipotecaAnual)],
    ];

    pdf.setFontSize(9);
    financeData.forEach(([label, value]) => {
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, margin, yPos);
        pdf.setTextColor(...darkColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, margin + 60, yPos);
        yPos += 5.5;
    });

    yPos += 5;

    // =====================
    // CHARTS - Capture from DOM
    // =====================
    if (chartElement) {
        try {
            // Check if we need a new page
            if (yPos > pageHeight - 100) {
                pdf.addPage();
                yPos = margin;
            }

            pdf.setTextColor(...darkColor);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Proyección de Cash-Flow', margin, yPos);
            addLine(margin, pageWidth - margin, yPos + 3);
            yPos += 10;

            const canvas = await html2canvas(chartElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (canvas.height / canvas.width) * imgWidth;

            pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, 60));
            yPos += Math.min(imgHeight, 60) + 10;
        } catch (error) {
            console.error('Error capturing chart:', error);
        }
    }

    // =====================
    // SUMMARY BOX
    // =====================
    if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
    }

    pdf.setTextColor(...darkColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resumen de la Inversión', margin, yPos);
    addLine(margin, pageWidth - margin, yPos + 3);
    yPos += 10;

    const summaryData = [
        { label: 'Inversión total', value: formatCurrency(results.totalCompra), color: 'dark' },
        { label: 'Capital propio', value: formatCurrency(results.capitalAportar), color: 'dark' },
        { label: 'Ingreso anual', value: formatCurrency(results.ingresoAnual), color: 'green' },
        { label: 'Gastos anuales', value: formatCurrency(results.totalGastosAnual), color: 'red' },
        { label: 'Cash-Flow anual', value: formatCurrency(results.cashFlowAnual), color: results.cashFlowAnual >= 0 ? 'green' : 'red' },
        { label: 'Recuperación (años)', value: formatNumber(results.per, 1), color: 'dark' },
    ];

    pdf.setFontSize(10);
    summaryData.forEach(({ label, value, color }) => {
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, margin, yPos);

        let valueColor = darkColor;
        if (color === 'green') valueColor = greenColor;
        if (color === 'red') valueColor = redColor;

        pdf.setTextColor(...valueColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });

        pdf.setDrawColor(224, 216, 208);
        pdf.setLineWidth(0.2);
        pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

        yPos += 7;
    });

    // =====================
    // FOOTER
    // =====================
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Calculadora de Rentabilidad Inmobiliaria | zona3.club', pageWidth / 2, pageHeight - 5, { align: 'center' });

    // =====================
    // SAVE
    // =====================
    const fileName = `Informe_Inversion_${inputs.direccion.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
}
