import { getConsumptionReport, getFinancialReport, getInventoryReport, getRotationReport, getValuationReport } from "@/api/services/reportService";
import glass_bag from "@/assets/images/glass/ic_glass_bag.png";
import glass_buy from "@/assets/images/glass/ic_glass_buy.png";
import glass_message from "@/assets/images/glass/ic_glass_message.png";
import glass_users from "@/assets/images/glass/ic_glass_users.png";
import { Chart, useChart } from "@/components/chart";
import { themeVars } from "@/theme/theme.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { fCurrency } from "@/utils/format-number";
import { useEffect, useMemo, useState } from "react";
import AnalysisCard from "../analysis/analysis-card";
import BannerCard from "./banner-card";

function Workbench() {
	const [inventory, setInventory] = useState<Awaited<ReturnType<typeof getInventoryReport>> | null>(null);
	const [consumption, setConsumption] = useState<Awaited<ReturnType<typeof getConsumptionReport>> | null>(null);
	const [financial, setFinancial] = useState<Awaited<ReturnType<typeof getFinancialReport>> | null>(null);
	const [rotation, setRotation] = useState<Awaited<ReturnType<typeof getRotationReport>> | null>(null);
	const [valuation, setValuation] = useState<Awaited<ReturnType<typeof getValuationReport>> | null>(null);

	const formatDate = (d: Date) => d.toISOString().slice(0, 10);
	const now = new Date();
	const start = new Date(now);
	start.setMonth(now.getMonth() - 3);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const filters = useMemo(() => ({ startDate: formatDate(start), endDate: formatDate(now), estado: "CONFIRMADA" as const }), []);

	useEffect(() => {
		let mounted = true;
		const fetchAll = async () => {
			try {
				const [inv, cons, fin, rot, val] = await Promise.all([
					getInventoryReport(),
					getConsumptionReport(filters),
					getFinancialReport(filters),
					getRotationReport(filters),
					getValuationReport(filters),
				]);
				if (!mounted) return;
				setInventory(inv);
				setConsumption(cons);
				setFinancial(fin);
				setRotation(rot);
				setValuation(val);
			} finally {
			}
		};
		fetchAll();
		const id = window.setInterval(fetchAll, 60000);
		return () => {
			mounted = false;
			window.clearInterval(id);
		};
	}, [filters]);

	const stockLabels = ["Normal", "Bajo", "Crítico"];
	const stockSeries = useMemo(() => {
		const total = inventory?.totalProducts ?? 0;
		const low = inventory?.lowStockCount ?? 0;
		const critical = inventory?.criticalStockCount ?? 0;
		const normal = Math.max(total - low - critical, 0);
		return [normal, low, critical];
	}, [inventory]);

	const valuationCategories = valuation?.historicalValues.map((v) => v.date) ?? [];
	const valuationSeries = [{ name: "Valor", data: valuation?.historicalValues.map((v) => v.value) ?? [] }];

	const financialCategories = financial?.monthlyComparison?.map((m) => m.month) ?? [];
	const financialSeries = [{ name: "Gasto", data: financial?.monthlyComparison?.map((m) => m.total) ?? [] }];

	const consumptionTop = useMemo(() => {
		const list = [...(consumption?.products ?? [])].sort((a, b) => b.quantity_consumed - a.quantity_consumed);
		const top = list.slice(0, 5);
		const rest = list.slice(5);
		const restTotal = rest.reduce((sum, p) => sum + p.quantity_consumed, 0);
		const labels = top.map((p) => p.product_name);
		const series = top.map((p) => p.quantity_consumed);
		if (restTotal > 0) {
			labels.push("Otros");
			series.push(restTotal);
		}
		return { labels, series };
	}, [consumption]);

	const topHighCategories = rotation?.topHighRotation.map((r) => r.product_name) ?? [];
	const topHighSeries = [{ name: "Rotación", data: rotation?.topHighRotation.map((r) => Number(r.rotation_rate.toFixed(2))) ?? [] }];

	const topLowCategories = rotation?.topLowRotation.map((r) => r.product_name) ?? [];
	const topLowSeries = [{ name: "Rotación", data: rotation?.topLowRotation.map((r) => Number(r.rotation_rate.toFixed(2))) ?? [] }];

	return (
		<div className="p-2">
			<BannerCard />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
				<AnalysisCard
					cover={glass_bag}
					title={fCurrency(inventory?.totalValue ?? 0)}
					subtitle="Valor inventario"
					style={{ color: themeVars.colors.palette.success.dark, backgroundColor: `rgba(${themeVars.colors.palette.success.defaultChannel} / .2)` }}
				/>
				<AnalysisCard
					cover={glass_users}
					title={(inventory?.totalProducts ?? 0).toString()}
					subtitle="Productos"
					style={{ color: themeVars.colors.palette.info.dark, backgroundColor: `rgba(${themeVars.colors.palette.info.defaultChannel} / .2)` }}
				/>
				<AnalysisCard
					cover={glass_buy}
					title={fCurrency(financial?.totalSpent ?? 0)}
					subtitle="Gasto período"
					style={{ color: themeVars.colors.palette.warning.dark, backgroundColor: `rgba(${themeVars.colors.palette.warning.defaultChannel} / .2)` }}
				/>
				<AnalysisCard
					cover={glass_message}
					title={`${inventory?.criticalStockCount ?? 0}`}
					subtitle="Stock crítico"
					style={{ color: themeVars.colors.palette.error.dark, backgroundColor: `rgba(${themeVars.colors.palette.error.defaultChannel} / .2)` }}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
				<Card>
					<CardHeader>
						<CardTitle>Valoración histórica</CardTitle>
					</CardHeader>
					<CardContent>
						<AreaChart series={valuationSeries} categories={valuationCategories} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Gasto mensual</CardTitle>
					</CardHeader>
					<CardContent>
						<BarChart series={financialSeries} categories={financialCategories} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Salud de stock</CardTitle>
					</CardHeader>
					<CardContent>
						<DonutChart series={stockSeries} labels={stockLabels} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Distribución de consumo</CardTitle>
					</CardHeader>
					<CardContent>
						<PieChart series={consumptionTop.series} labels={consumptionTop.labels} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Top mayor rotación</CardTitle>
					</CardHeader>
					<CardContent>
						<BarChart series={topHighSeries} categories={topHighCategories} horizontal />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Top menor rotación</CardTitle>
					</CardHeader>
					<CardContent>
						<BarChart series={topLowSeries} categories={topLowCategories} horizontal />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function AreaChart({ series, categories }: { series: { name: string; data: number[] }[]; categories: string[] }) {
	const options = useChart({
		xaxis: { type: "category", categories },
		fill: { gradient: { type: "vertical", opacityFrom: 0.4, opacityTo: 0 } },
		tooltip: {},
	});
	return <Chart type="area" series={series} options={options} height={320} />;
}

function BarChart({ series, categories, horizontal = false }: { series: { name: string; data: number[] }[]; categories: string[]; horizontal?: boolean }) {
	const options = useChart({
		xaxis: { categories },
		plotOptions: { bar: { horizontal } },
		tooltip: {},
	});
	return <Chart type="bar" series={series} options={options} height={320} />;
}

function DonutChart({ series, labels }: { series: number[]; labels: string[] }) {
	const options = useChart({
		labels,
		stroke: { show: false },
		legend: { position: "bottom", horizontalAlign: "center" },
		chart: { width: 240 },
		plotOptions: { pie: { donut: { size: "90%" } } },
	});
	return <Chart type="donut" series={series} options={options} height={360} />;
}

function PieChart({ series, labels }: { series: number[]; labels: string[] }) {
	const options = useChart({ labels, legend: { position: "bottom", horizontalAlign: "center" }, tooltip: { fillSeriesColor: false } });
	return <Chart type="pie" series={series} options={options} height={360} />;
}

export default Workbench;
