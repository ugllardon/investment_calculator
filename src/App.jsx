import { useState, useMemo } from 'react';
import { communities, getItpRate } from './data/itpTable';
import { calculateInvestment, generateCashFlowProjection, formatCurrency, formatPercentage, formatNumber } from './utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Area } from 'recharts';

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

    // Breakdown data for pie/bar chart
    const expenseBreakdown = [
        { name: 'Hipoteca', value: Math.round(results.cuotaHipotecaMensual), fill: '#6366f1' },
        { name: 'Impuestos', value: Math.round(inputs.impuestosAnuales / 12), fill: '#f59e0b' },
        { name: 'Seguros', value: Math.round(inputs.segurosAnuales / 12), fill: '#10b981' },
        { name: 'Comunidad', value: Math.round(inputs.comunidadAnual / 12), fill: '#ec4899' },
        { name: 'Mantenimiento', value: Math.round(inputs.mantenimientoAnual / 12), fill: '#8b5cf6' },
    ].filter(item => item.value > 0);

    const monthlyComparison = [
        { name: 'Ingresos', ingresos: inputs.cuotaAlquiler, gastos: 0, cashflow: 0 },
        { name: 'Gastos', ingresos: 0, gastos: Math.round(results.cuotaHipotecaMensual + results.totalGastosMensual), cashflow: 0 },
        { name: 'Cash-Flow', ingresos: 0, gastos: 0, cashflow: Math.round(results.cashFlowMensual) },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Calculadora de Rentabilidad
                </h1>
                <p className="text-gray-400 text-lg">Analiza la rentabilidad de tu inversión inmobiliaria</p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN - INPUTS */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Location Card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📍</span> Localización
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={inputs.direccion}
                                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                                    placeholder="Calle, número..."
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Comunidad Autónoma</label>
                                <select
                                    value={inputs.comunidad}
                                    onChange={(e) => handleInputChange('comunidad', e.target.value)}
                                >
                                    {communities.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                                <span className="text-gray-400">ITP Aplicable</span>
                                <span className="text-white font-semibold text-lg">{formatPercentage(itpRate, 1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Costs Card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏠</span> Coste de Compra
                        </h2>
                        <div className="space-y-3">
                            <InputField label="Precio de compra (€)" value={inputs.precioCompra} onChange={(v) => handleNumberInput('precioCompra', v)} />
                            <InputField label="Gastos (Notaría, registro…)" value={inputs.gastos} onChange={(v) => handleNumberInput('gastos', v)} />
                            <InputField label="Gastos hipoteca" value={inputs.gastosHipoteca} onChange={(v) => handleNumberInput('gastosHipoteca', v)} />
                            <InputField label="Coste reforma" value={inputs.costeReforma} onChange={(v) => handleNumberInput('costeReforma', v)} />
                            <InputField label="Comisión compra" value={inputs.comision} onChange={(v) => handleNumberInput('comision', v)} />
                            <InputField label="Mobiliario y otros" value={inputs.mobiliario} onChange={(v) => handleNumberInput('mobiliario', v)} />

                            <div className="border-t border-white/10 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Impuesto ITP</span>
                                    <span className="text-white font-medium">{formatCurrency(results.impuestoITP)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-white font-semibold">TOTAL COMPRA</span>
                                    <span className="text-indigo-400 font-bold text-xl">{formatCurrency(results.totalCompra)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Income Card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">💰</span> Ingresos
                        </h2>
                        <div className="space-y-3">
                            <InputField label="Cuota alquiler mensual (€)" value={inputs.cuotaAlquiler} onChange={(v) => handleNumberInput('cuotaAlquiler', v)} />
                            <InputField
                                label="Revalorización anual esperada (%)"
                                value={inputs.revalorizacion * 100}
                                onChange={(v) => handlePercentInput('revalorizacion', v)}
                                step="0.1"
                            />
                            <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                                <span className="text-gray-400">Ingreso anual</span>
                                <span className="text-emerald-400 font-semibold">{formatCurrency(results.ingresoAnual)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financing Card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏦</span> Financiación
                        </h2>
                        <div className="space-y-3">
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

                            <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Hipoteca</span>
                                    <span className="text-white font-medium">{formatCurrency(results.hipoteca)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Capital a aportar</span>
                                    <span className="text-amber-400 font-semibold">{formatCurrency(results.capitalAportar)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Cuota hipoteca</span>
                                    <span className="text-white font-medium">{formatCurrency(results.cuotaHipotecaMensual)}/mes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Annual Expenses Card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📊</span> Gastos Anuales
                        </h2>
                        <div className="space-y-3">
                            <InputField label="Impuestos (IBI, basuras…)" value={inputs.impuestosAnuales} onChange={(v) => handleNumberInput('impuestosAnuales', v)} />
                            <InputField label="Seguros" value={inputs.segurosAnuales} onChange={(v) => handleNumberInput('segurosAnuales', v)} />
                            <InputField label="Comunidad propietarios" value={inputs.comunidadAnual} onChange={(v) => handleNumberInput('comunidadAnual', v)} />
                            <InputField label="Mantenimiento" value={inputs.mantenimientoAnual} onChange={(v) => handleNumberInput('mantenimientoAnual', v)} />
                            <InputField label="Períodos vacío" value={inputs.periodosVacioAnual} onChange={(v) => handleNumberInput('periodosVacioAnual', v)} />

                            <div className="border-t border-white/10 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-semibold">TOTAL GASTOS</span>
                                    <span className="text-rose-400 font-bold">{formatCurrency(results.totalGastosAnual)}/año</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - RESULTS */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Main KPIs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <KPICard
                            title="Rentabilidad Bruta"
                            value={formatPercentage(results.rentabilidadBruta, 1)}
                            isPositive={results.rentabilidadBruta > 0}
                            highlight
                            tooltip="Ingresos anuales / Inversión total"
                        />
                        <KPICard
                            title="Rentabilidad Neta"
                            value={formatPercentage(results.rentabilidadNeta, 1)}
                            isPositive={results.rentabilidadNeta > 0}
                            highlight
                            tooltip="(Ingresos - Gastos - Intereses) / Inversión"
                        />
                        <KPICard
                            title="Cash-Flow Mensual"
                            value={formatCurrency(results.cashFlowMensual)}
                            isPositive={results.cashFlowMensual >= 0}
                            highlight
                            tooltip="Alquiler - Hipoteca - Gastos mensuales"
                        />
                        <KPICard
                            title="PER"
                            value={formatNumber(results.per, 2)}
                            isPositive={results.per > 0 && results.per < 15}
                            tooltip="Años para recuperar inversión"
                        />
                        <KPICard
                            title="% Hipoteca / Alquiler"
                            value={formatPercentage(results.porcentajeHipotecaAlquiler, 1)}
                            isPositive={results.porcentajeHipotecaAlquiler < 0.5}
                            tooltip="Porcentaje del alquiler que va a hipoteca"
                        />
                        <KPICard
                            title="Cash-Flow / Alquiler"
                            value={formatPercentage(results.cashFlowAlquiler, 1)}
                            isPositive={results.cashFlowAlquiler > 0}
                            tooltip="Porcentaje del alquiler que queda libre"
                        />
                        <KPICard
                            title="Cash on Cash"
                            value={formatPercentage(results.cashOnCash, 1)}
                            isPositive={results.cashOnCash > 0}
                            tooltip="Rentabilidad sobre capital aportado"
                        />
                        <KPICard
                            title="ROCE"
                            value={formatPercentage(results.roce, 2)}
                            isPositive={results.roce > 0}
                            highlight
                            tooltip="Return on Capital Employed"
                        />
                        <KPICard
                            title="Rentabilidad Total"
                            value={formatPercentage(results.rentabilidadTotal, 2)}
                            isPositive={results.rentabilidadTotal > 0}
                            highlight
                            tooltip="Incluye revalorización y amortización"
                        />
                    </div>

                    {/* Financing Details Card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📋</span> Detalle Financiación
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Cuota Hipoteca" monthly={results.cuotaHipotecaMensual} annual={results.cuotaHipotecaAnual} />
                            <DetailItem label="Intereses (promedio)" monthly={results.interesesPromedioMensual} annual={results.interesesPromedioAnual} />
                            <DetailItem label="Amortización (promedio)" monthly={results.amortizacionPromedioMensual} annual={results.amortizacionPromedioAnual} />
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📈</span> Desglose Mensual
                        </h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expenseBreakdown} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)' }} width={100} />
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px' }}
                                        labelStyle={{ color: 'white' }}
                                        formatter={(value) => [`${value} €`, 'Mensual']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cash Flow Projection Chart */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📊</span> Proyección Cash-Flow (10 años)
                        </h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={cashFlowProjection}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px' }}
                                        labelStyle={{ color: 'white' }}
                                        formatter={(value) => [`${formatCurrency(value)}`, '']}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="accumulated" name="Acumulado" fill="rgba(99,102,241,0.2)" stroke="#6366f1" />
                                    <Bar dataKey="cashFlow" name="Cash-Flow Anual" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="glass-card-dark p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🎯</span> Resumen de la Inversión
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <SummaryRow label="Inversión total" value={formatCurrency(results.totalCompra)} />
                            <SummaryRow label="Capital propio" value={formatCurrency(results.capitalAportar)} />
                            <SummaryRow label="Ingreso anual" value={formatCurrency(results.ingresoAnual)} color="green" />
                            <SummaryRow label="Gastos anuales" value={formatCurrency(results.totalGastosAnual)} color="red" />
                            <SummaryRow label="Cash-Flow anual" value={formatCurrency(results.cashFlowAnual)} color={results.cashFlowAnual >= 0 ? 'green' : 'red'} />
                            <SummaryRow label="Recuperación (años)" value={formatNumber(results.per, 1)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center mt-12 text-gray-500 text-sm">
                <p>Calculadora de Rentabilidad Inmobiliaria</p>
            </footer>
        </div>
    );
}

// Input Field Component
function InputField({ label, value, onChange, step = "1", max, min = 0 }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label className="text-gray-400 text-sm flex-shrink-0">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                min={min}
                max={max}
                className="w-28 text-right"
            />
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, isPositive, highlight, tooltip }) {
    return (
        <div
            className={`glass-card kpi-card p-4 ${highlight ? 'kpi-highlight' : ''}`}
            title={tooltip}
        >
            <p className="text-gray-400 text-xs mb-1">{title}</p>
            <p className={`text-2xl font-bold ${isPositive ? 'value-positive' : 'value-negative'}`}>
                {value}
            </p>
        </div>
    );
}

// Detail Item Component
function DetailItem({ label, monthly, annual }) {
    return (
        <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-2">{label}</p>
            <p className="text-white font-semibold">{formatCurrency(monthly)}<span className="text-gray-500 text-xs">/mes</span></p>
            <p className="text-gray-400 text-sm">{formatCurrency(annual)}<span className="text-gray-500 text-xs">/año</span></p>
        </div>
    );
}

// Summary Row Component
function SummaryRow({ label, value, color }) {
    const colorClass = color === 'green' ? 'text-emerald-400' : color === 'red' ? 'text-rose-400' : 'text-white';
    return (
        <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-400">{label}</span>
            <span className={`font-semibold ${colorClass}`}>{value}</span>
        </div>
    );
}

export default App;
