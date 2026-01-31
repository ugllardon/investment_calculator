import { useState, useMemo } from 'react';
import { communities, getItpRate } from './data/itpTable';
import { calculateInvestment, generateCashFlowProjection, formatCurrency, formatPercentage, formatNumber } from './utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';

// Default values from Excel
const defaultInputs = {
    direccion: 'Calle xxx',
    comunidad: 'Cataluña',
    precioCompra: 105000,
    gastos: 4000,
    gastosHipoteca: 0,
    costeReforma: 20000,
    comision: 1500,
    mobiliario: 4000,
    cuotaAlquiler: 1100,
    revalorizacion: 0.02,
    porcentajeFinanciado: 0.5,
    plazoHipoteca: 30,
    tipoInteres: 0.02,
    impuestosAnuales: 800,
    segurosAnuales: 300,
    comunidadAnual: 300,
    mantenimientoAnual: 0,
    periodosVacioAnual: 0,
};

function App() {
    const [inputs, setInputs] = useState(defaultInputs);

    const itpRate = getItpRate(inputs.comunidad);

    const results = useMemo(() => {
        return calculateInvestment({
            ...inputs,
            itpRate,
        });
    }, [inputs, itpRate]);

    const cashFlowProjection = useMemo(() => {
        return generateCashFlowProjection(results, inputs.revalorizacion, 10);
    }, [results, inputs.revalorizacion]);

    const handleInputChange = (field, value) => {
        setInputs(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNumberInput = (field, value) => {
        const numValue = parseFloat(value) || 0;
        handleInputChange(field, numValue);
    };

    const handlePercentInput = (field, value) => {
        const numValue = (parseFloat(value) || 0) / 100;
        handleInputChange(field, numValue);
    };

    // Breakdown data for chart - Orange/terracotta palette
    const expenseBreakdown = [
        { name: 'Hipoteca', value: Math.round(results.cuotaHipotecaMensual), fill: '#c4513d' },
        { name: 'Impuestos', value: Math.round(inputs.impuestosAnuales / 12), fill: '#d97952' },
        { name: 'Seguros', value: Math.round(inputs.segurosAnuales / 12), fill: '#e8a07a' },
        { name: 'Comunidad', value: Math.round(inputs.comunidadAnual / 12), fill: '#b8442f' },
        { name: 'Mantenimiento', value: Math.round(inputs.mantenimientoAnual / 12), fill: '#9c3928' },
    ].filter(item => item.value > 0);

    return (
        <div className="min-h-screen p-6 md:p-10 lg:p-12">
            {/* Header */}
            <header className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-[#2d2d2d] mb-3 tracking-tight">
                    Calculadora de Rentabilidad
                </h1>
                <p className="text-[#666] text-base">Analiza la rentabilidad de tu inversión inmobiliaria</p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN - INPUTS */}
                <div className="lg:col-span-5 space-y-8">

                    {/* Location Card */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <span className="step-number">1</span> Localización
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[#666] text-sm mb-2">Dirección</label>
                                <input
                                    type="text"
                                    value={inputs.direccion}
                                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                                    placeholder="Calle, número..."
                                />
                            </div>
                            <div>
                                <label className="block text-[#666] text-sm mb-2">Comunidad Autónoma</label>
                                <select
                                    value={inputs.comunidad}
                                    onChange={(e) => handleInputChange('comunidad', e.target.value)}
                                >
                                    {communities.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between items-center bg-[#faf8f5] border border-[#e0d8d0] rounded-lg p-4 mt-2">
                                <span className="text-[#666]">ITP Aplicable</span>
                                <span className="text-[#c4513d] font-bold text-lg">{formatPercentage(itpRate, 1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Costs Card */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <span className="step-number">2</span> Coste de Compra
                        </h2>
                        <div className="space-y-4">
                            <InputField label="Precio de compra (€)" value={inputs.precioCompra} onChange={(v) => handleNumberInput('precioCompra', v)} />
                            <InputField label="Gastos (Notaría, registro…)" value={inputs.gastos} onChange={(v) => handleNumberInput('gastos', v)} />
                            <InputField label="Gastos hipoteca" value={inputs.gastosHipoteca} onChange={(v) => handleNumberInput('gastosHipoteca', v)} />
                            <InputField label="Coste reforma" value={inputs.costeReforma} onChange={(v) => handleNumberInput('costeReforma', v)} />
                            <InputField label="Comisión compra" value={inputs.comision} onChange={(v) => handleNumberInput('comision', v)} />
                            <InputField label="Mobiliario y otros" value={inputs.mobiliario} onChange={(v) => handleNumberInput('mobiliario', v)} />

                            <div className="border-t border-[#e0d8d0] pt-5 mt-5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[#666]">Impuesto ITP</span>
                                    <span className="text-[#2d2d2d] font-medium">{formatCurrency(results.impuestoITP)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#2d2d2d] font-semibold">TOTAL COMPRA</span>
                                    <span className="text-[#c4513d] font-bold text-xl">{formatCurrency(results.totalCompra)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Income Card */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <span className="step-number">3</span> Ingresos
                        </h2>
                        <div className="space-y-4">
                            <InputField label="Cuota alquiler mensual (€)" value={inputs.cuotaAlquiler} onChange={(v) => handleNumberInput('cuotaAlquiler', v)} />
                            <InputField
                                label="Revalorización anual (%)"
                                value={inputs.revalorizacion * 100}
                                onChange={(v) => handlePercentInput('revalorizacion', v)}
                                step="0.1"
                            />
                            <div className="flex justify-between items-center bg-[#faf8f5] border border-[#e0d8d0] rounded-lg p-4 mt-2">
                                <span className="text-[#666]">Ingreso anual</span>
                                <span className="text-[#c4513d] font-bold">{formatCurrency(results.ingresoAnual)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financing Card */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <span className="step-number">4</span> Financiación
                        </h2>
                        <div className="space-y-4">
                            <InputField
                                label="% Financiado"
                                value={inputs.porcentajeFinanciado * 100}
                                onChange={(v) => handlePercentInput('porcentajeFinanciado', v)}
                                max={100}
                            />
                            <InputField label="Plazo hipoteca (años)" value={inputs.plazoHipoteca} onChange={(v) => handleNumberInput('plazoHipoteca', v)} />
                            <InputField
                                label="Tipo de interés (%)"
                                value={inputs.tipoInteres * 100}
                                onChange={(v) => handlePercentInput('tipoInteres', v)}
                                step="0.1"
                            />

                            <div className="border-t border-[#e0d8d0] pt-5 mt-5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#666]">Hipoteca</span>
                                    <span className="text-[#2d2d2d] font-medium">{formatCurrency(results.hipoteca)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#666]">Capital a aportar</span>
                                    <span className="text-[#c4513d] font-semibold">{formatCurrency(results.capitalAportar)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#666]">Cuota hipoteca</span>
                                    <span className="text-[#2d2d2d] font-medium">{formatCurrency(results.cuotaHipotecaMensual)}/mes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Annual Expenses Card */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <span className="step-number">5</span> Gastos Anuales
                        </h2>
                        <div className="space-y-4">
                            <InputField label="Impuestos (IBI, basuras…)" value={inputs.impuestosAnuales} onChange={(v) => handleNumberInput('impuestosAnuales', v)} />
                            <InputField label="Seguros" value={inputs.segurosAnuales} onChange={(v) => handleNumberInput('segurosAnuales', v)} />
                            <InputField label="Comunidad propietarios" value={inputs.comunidadAnual} onChange={(v) => handleNumberInput('comunidadAnual', v)} />
                            <InputField label="Mantenimiento" value={inputs.mantenimientoAnual} onChange={(v) => handleNumberInput('mantenimientoAnual', v)} />
                            <InputField label="Períodos vacío" value={inputs.periodosVacioAnual} onChange={(v) => handleNumberInput('periodosVacioAnual', v)} />

                            <div className="border-t border-[#e0d8d0] pt-5 mt-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#2d2d2d] font-semibold">TOTAL GASTOS</span>
                                    <span className="text-[#dc2626] font-bold">{formatCurrency(results.totalGastosAnual)}/año</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - RESULTS */}
                <div className="lg:col-span-7 space-y-8">

                    {/* Main KPIs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <KPICard
                            title="Rentabilidad Bruta"
                            value={formatPercentage(results.rentabilidadBruta, 1)}
                            isPositive={results.rentabilidadBruta > 0}
                            highlight
                        />
                        <KPICard
                            title="Rentabilidad Neta"
                            value={formatPercentage(results.rentabilidadNeta, 1)}
                            isPositive={results.rentabilidadNeta > 0}
                            highlight
                        />
                        <KPICard
                            title="Cash-Flow Mensual"
                            value={formatCurrency(results.cashFlowMensual)}
                            isPositive={results.cashFlowMensual >= 0}
                            highlight
                        />
                        <KPICard
                            title="PER"
                            value={formatNumber(results.per, 2)}
                            isPositive={results.per > 0 && results.per < 15}
                        />
                        <KPICard
                            title="% Hipoteca / Alquiler"
                            value={formatPercentage(results.porcentajeHipotecaAlquiler, 1)}
                            isPositive={results.porcentajeHipotecaAlquiler < 0.5}
                        />
                        <KPICard
                            title="Cash-Flow / Alquiler"
                            value={formatPercentage(results.cashFlowAlquiler, 1)}
                            isPositive={results.cashFlowAlquiler > 0}
                        />
                        <KPICard
                            title="Cash on Cash"
                            value={formatPercentage(results.cashOnCash, 1)}
                            isPositive={results.cashOnCash > 0}
                        />
                        <KPICard
                            title="ROCE"
                            value={formatPercentage(results.roce, 2)}
                            isPositive={results.roce > 0}
                            highlight
                        />
                        <KPICard
                            title="Rentabilidad Total"
                            value={formatPercentage(results.rentabilidadTotal, 2)}
                            isPositive={results.rentabilidadTotal > 0}
                            highlight
                        />
                    </div>

                    {/* Financing Details Card */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <CheckIcon /> Detalle Financiación
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <DetailItem label="Cuota Hipoteca" monthly={results.cuotaHipotecaMensual} annual={results.cuotaHipotecaAnual} />
                            <DetailItem label="Intereses (promedio)" monthly={results.interesesPromedioMensual} annual={results.interesesPromedioAnual} />
                            <DetailItem label="Amortización (promedio)" monthly={results.amortizacionPromedioMensual} annual={results.amortizacionPromedioAnual} />
                        </div>
                    </div>

                    {/* Charts - Expense Breakdown */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <CheckIcon /> Desglose Mensual
                        </h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expenseBreakdown} layout="vertical">
                                    <XAxis
                                        type="number"
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        axisLine={{ stroke: '#e0d8d0' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'white',
                                            border: '2px solid #c4513d',
                                            borderRadius: '8px',
                                            color: '#2d2d2d'
                                        }}
                                        formatter={(value) => [`${value} €`, 'Mensual']}
                                        cursor={{ fill: 'rgba(196, 81, 61, 0.08)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cash Flow Projection Chart */}
                    <div className="glass-card p-8">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <CheckIcon /> Proyección Cash-Flow (10 años)
                        </h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={cashFlowProjection}>
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fill: '#666', fontSize: 11 }}
                                        axisLine={{ stroke: '#e0d8d0' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#666', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'white',
                                            border: '2px solid #c4513d',
                                            borderRadius: '8px',
                                            color: '#2d2d2d'
                                        }}
                                        formatter={(value) => [`${formatCurrency(value)}`, '']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="accumulated"
                                        name="Acumulado"
                                        fill="rgba(196, 81, 61, 0.1)"
                                        stroke="#c4513d"
                                        strokeWidth={2}
                                    />
                                    <Bar
                                        dataKey="cashFlow"
                                        name="Cash-Flow Anual"
                                        fill="#d97952"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="glass-card p-8 border-2 border-[#c4513d]">
                        <h2 className="section-title mb-6 flex items-center gap-3">
                            <CheckIcon /> Resumen de la Inversión
                        </h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            <SummaryRow label="Inversión total" value={formatCurrency(results.totalCompra)} />
                            <SummaryRow label="Capital propio" value={formatCurrency(results.capitalAportar)} />
                            <SummaryRow label="Ingreso anual" value={formatCurrency(results.ingresoAnual)} color="orange" />
                            <SummaryRow label="Gastos anuales" value={formatCurrency(results.totalGastosAnual)} color="red" />
                            <SummaryRow label="Cash-Flow anual" value={formatCurrency(results.cashFlowAnual)} color={results.cashFlowAnual >= 0 ? 'orange' : 'red'} />
                            <SummaryRow label="Recuperación (años)" value={formatNumber(results.per, 1)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center mt-16 text-[#999] text-sm">
                <p>Calculadora de Rentabilidad Inmobiliaria</p>
            </footer>
        </div>
    );
}

// Check Icon Component - Zona3 style
function CheckIcon() {
    return (
        <svg className="w-6 h-6 text-[#c4513d]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    );
}

// Input Field Component
function InputField({ label, value, onChange, step = "1", max, min = 0 }) {
    return (
        <div className="flex items-center justify-between gap-6">
            <label className="text-[#666] text-sm flex-shrink-0">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                min={min}
                max={max}
                className="w-32 text-right"
            />
        </div>
    );
}

// KPI Card Component - Zona3 Light Style with orange border
function KPICard({ title, value, isPositive, highlight }) {
    return (
        <div className={`glass-card kpi-card p-5 ${highlight ? 'kpi-highlight' : ''}`}>
            <p className="text-[#666] text-xs mb-2 uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-[#c4513d]' : 'text-[#dc2626]'}`}>
                {value}
            </p>
        </div>
    );
}

// Detail Item Component
function DetailItem({ label, monthly, annual }) {
    return (
        <div className="bg-[#faf8f5] border border-[#e0d8d0] rounded-lg p-5">
            <p className="text-[#666] text-xs mb-3 uppercase tracking-wide">{label}</p>
            <p className="text-[#2d2d2d] font-semibold text-lg">{formatCurrency(monthly)}<span className="text-[#999] text-xs ml-1">/mes</span></p>
            <p className="text-[#666] text-sm mt-1">{formatCurrency(annual)}<span className="text-[#999] text-xs ml-1">/año</span></p>
        </div>
    );
}

// Summary Row Component
function SummaryRow({ label, value, color }) {
    const colorClass = color === 'orange' ? 'text-[#c4513d]' : color === 'red' ? 'text-[#dc2626]' : 'text-[#2d2d2d]';
    return (
        <div className="flex justify-between items-center py-3 border-b border-[#e0d8d0]">
            <span className="text-[#666]">{label}</span>
            <span className={`font-semibold ${colorClass}`}>{value}</span>
        </div>
    );
}

export default App;
