/**
 * Investment Calculator - Financial Formulas
 * Extracted from CALCULADORA-ALQUILER-ZONA3.xlsx
 * All formulas are replicated exactly as in the Excel file
 */

/**
 * PMT function - Calculate monthly mortgage payment
 * Excel: PMT(rate/12, years*12, -principal, 0)
 * @param {number} annualRate - Annual interest rate (decimal, e.g., 0.02 for 2%)
 * @param {number} years - Loan term in years
 * @param {number} principal - Loan amount
 * @returns {number} Monthly payment
 */
export const calculatePMT = (annualRate, years, principal) => {
    if (principal <= 0 || years <= 0) return 0;
    if (annualRate <= 0) return principal / (years * 12);

    const monthlyRate = annualRate / 12;
    const totalPayments = years * 12;

    return principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)
        / (Math.pow(1 + monthlyRate, totalPayments) - 1);
};

/**
 * Calculate all investment metrics
 * @param {Object} inputs - All input values
 * @returns {Object} All calculated metrics
 */
export const calculateInvestment = (inputs) => {
    const {
        // Purchase costs
        precioCompra = 0,
        itpRate = 0.10,
        gastos = 0,
        gastosHipoteca = 0,
        costeReforma = 0,
        comision = 0,
        mobiliario = 0,

        // Income
        cuotaAlquiler = 0,
        revalorizacion = 0,

        // Financing
        porcentajeFinanciado = 0,
        plazoHipoteca = 30,
        tipoInteres = 0.02,

        // Annual expenses
        impuestosAnuales = 0,
        segurosAnuales = 0,
        comunidadAnual = 0,
        mantenimientoAnual = 0,
        periodosVacioAnual = 0,
    } = inputs;

    // ============ PURCHASE CALCULATIONS ============
    // Excel: C12 = C11 * C8 (ITP Tax)
    const impuestoITP = precioCompra * itpRate;

    // Excel: C18 = SUM(C11:C17) (Total Purchase)
    const totalCompra = precioCompra + impuestoITP + gastos + gastosHipoteca + costeReforma + comision + mobiliario;

    // ============ FINANCING CALCULATIONS ============
    // Excel: G14 = C11 * G13 (Mortgage Amount)
    const hipoteca = precioCompra * porcentajeFinanciado;

    // Excel: G15 = C18 - G14 (Capital to Invest)
    const capitalAportar = totalCompra - hipoteca;

    // Excel: G19 = PMT(G17/12, G16*12, -G14, 0) (Monthly Mortgage Payment)
    const cuotaHipotecaMensual = calculatePMT(tipoInteres, plazoHipoteca, hipoteca);

    // Excel: H19 = G19 * 12 (Annual Mortgage Payment)
    const cuotaHipotecaAnual = cuotaHipotecaMensual * 12;

    // Excel: G20 = ((G19*12*G16) - G14) / (G16*12) (Average Monthly Interest)
    const interesesPromedioMensual = hipoteca > 0 && plazoHipoteca > 0
        ? ((cuotaHipotecaMensual * 12 * plazoHipoteca) - hipoteca) / (plazoHipoteca * 12)
        : 0;

    // Excel: H20 = G20 * 12 (Average Annual Interest)
    const interesesPromedioAnual = interesesPromedioMensual * 12;

    // Excel: G21 = G19 - G20 (Average Monthly Amortization)
    const amortizacionPromedioMensual = cuotaHipotecaMensual - interesesPromedioMensual;

    // Excel: H21 = G21 * 12 (Average Annual Amortization)
    const amortizacionPromedioAnual = amortizacionPromedioMensual * 12;

    // ============ EXPENSES CALCULATIONS ============
    // Excel: C26 = SUM(C21:C25) (Total Monthly Expenses)
    const totalGastosMensual = (impuestosAnuales + segurosAnuales + comunidadAnual + mantenimientoAnual + periodosVacioAnual) / 12;

    // Excel: D26 = SUM(D21:D25) (Total Annual Expenses)
    const totalGastosAnual = impuestosAnuales + segurosAnuales + comunidadAnual + mantenimientoAnual + periodosVacioAnual;

    // ============ INCOME CALCULATIONS ============
    // Excel: H6 = G6 * 12 (Annual Rent Income)
    const ingresoAnual = cuotaAlquiler * 12;

    // ============ KEY PERFORMANCE INDICATORS ============
    // Excel: G31 = H6 / C18 (Gross Yield / Rentabilidad Bruta)
    const rentabilidadBruta = totalCompra > 0 ? ingresoAnual / totalCompra : 0;

    // Excel: G32 = (H6 - D26 - H20) / C18 (Net Yield / Rentabilidad Neta)
    const rentabilidadNeta = totalCompra > 0
        ? (ingresoAnual - totalGastosAnual - interesesPromedioAnual) / totalCompra
        : 0;

    // Excel: G33 = G6 - G19 - C26 (Monthly Cash-Flow)
    const cashFlowMensual = cuotaAlquiler - cuotaHipotecaMensual - totalGastosMensual;

    // Annual Cash-Flow (not in original Excel but useful)
    const cashFlowAnual = cashFlowMensual * 12;

    // Excel: G34 = C18 / H6 (PER - Price Earnings Ratio)
    const per = ingresoAnual > 0 ? totalCompra / ingresoAnual : 0;

    // Excel: G35 = G19 / G6 (Mortgage to Rent Ratio)
    const porcentajeHipotecaAlquiler = cuotaAlquiler > 0 ? cuotaHipotecaMensual / cuotaAlquiler : 0;

    // Excel: G36 = G33 / G6 (Cash-Flow to Rent Ratio)
    const cashFlowAlquiler = cuotaAlquiler > 0 ? cashFlowMensual / cuotaAlquiler : 0;

    // Excel: G37 = 12 * G33 / G15 (Cash on Cash Return)
    const cashOnCash = capitalAportar > 0 ? (12 * cashFlowMensual) / capitalAportar : 0;

    // Excel: G38 = 12 * (G33 + G21) / G15 (ROCE - Return on Capital Employed)
    const roce = capitalAportar > 0
        ? (12 * (cashFlowMensual + amortizacionPromedioMensual)) / capitalAportar
        : 0;

    // Excel: G39 = (H6 - D26 - 12*G20) / G15 + G9 (Total Return including revaluation)
    const rentabilidadTotal = capitalAportar > 0
        ? ((ingresoAnual - totalGastosAnual - interesesPromedioAnual) / capitalAportar) + revalorizacion
        : 0;

    return {
        // Purchase
        impuestoITP,
        totalCompra,

        // Financing
        hipoteca,
        capitalAportar,
        cuotaHipotecaMensual,
        cuotaHipotecaAnual,
        interesesPromedioMensual,
        interesesPromedioAnual,
        amortizacionPromedioMensual,
        amortizacionPromedioAnual,

        // Expenses
        totalGastosMensual,
        totalGastosAnual,

        // Income
        ingresoAnual,

        // KPIs
        rentabilidadBruta,
        rentabilidadNeta,
        cashFlowMensual,
        cashFlowAnual,
        per,
        porcentajeHipotecaAlquiler,
        cashFlowAlquiler,
        cashOnCash,
        roce,
        rentabilidadTotal,
    };
};

/**
 * Generate cash flow projection over years
 * @param {Object} results - Calculation results
 * @param {number} revalorizacion - Annual revaluation rate
 * @param {number} years - Number of years to project
 * @returns {Array} Yearly cash flow data for charting
 */
export const generateCashFlowProjection = (results, revalorizacion = 0, years = 10) => {
    const projection = [];
    let accumulatedCashFlow = 0;
    let currentRent = results.cashFlowMensual * 12;

    for (let year = 1; year <= years; year++) {
        // Apply revaluation to rent each year
        if (year > 1) {
            currentRent *= (1 + revalorizacion);
        }

        accumulatedCashFlow += currentRent;

        projection.push({
            year: `Año ${year}`,
            cashFlow: Math.round(currentRent),
            accumulated: Math.round(accumulatedCashFlow),
        });
    }

    return projection;
};

/**
 * Format number as currency (EUR)
 * @param {number} value 
 * @returns {string}
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Format number as percentage
 * @param {number} value - Decimal value (0.10 for 10%)
 * @param {number} decimals - Decimal places
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format number with decimals
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};
