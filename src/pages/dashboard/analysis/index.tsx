import glass_bag from "@/assets/images/glass/ic_glass_bag.png";
import glass_buy from "@/assets/images/glass/ic_glass_buy.png";
import glass_message from "@/assets/images/glass/ic_glass_message.png";
import glass_users from "@/assets/images/glass/ic_glass_users.png";
import { Icon } from "@/components/icon";
import ChartBar from "@/pages/components/chart/view/chart-bar";
import ChartMixed from "@/pages/components/chart/view/chart-mixed";
import ChartPie from "@/pages/components/chart/view/chart-pie";
import ChartRadar from "@/pages/components/chart/view/chart-radar";
import { themeVars } from "@/theme/theme.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Title } from "@/ui/typography";
import AnalysisCard from "./analysis-card";
import AnalysisOrderTimeline from "./analysis-order-timeline";
import AnalysisTrafficCard from "./analysis-traffic-card";

import useLocale from "@/locales/use-locale";

function Analysis() {
	const { t } = useLocale();

	return (
		<div className="p-2">
			<Title as="h4">{t("sys.analysis.hi_welcome_back")} 👋</Title>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
				<AnalysisCard
					cover={glass_bag}
					title="714k"
					subtitle={t("sys.analysis.weekly_sales")}
					style={{
						color: themeVars.colors.palette.success.dark,
						backgroundColor: `rgba(${themeVars.colors.palette.success.defaultChannel} / .2)`,
					}}
				/>
				<AnalysisCard
					cover={glass_users}
					title="1.35m"
					subtitle={t("sys.analysis.new_users")}
					style={{
						color: themeVars.colors.palette.info.dark,
						backgroundColor: `rgba(${themeVars.colors.palette.info.defaultChannel} / .2)`,
					}}
				/>
				<AnalysisCard
					cover={glass_buy}
					title="1.72m"
					subtitle={t("sys.analysis.new_orders")}
					style={{
						color: themeVars.colors.palette.warning.dark,
						backgroundColor: `rgba(${themeVars.colors.palette.warning.defaultChannel} / .2)`,
					}}
				/>
				<AnalysisCard
					cover={glass_message}
					title="234"
					subtitle={t("sys.analysis.bug_reports")}
					style={{
						color: themeVars.colors.palette.error.dark,
						backgroundColor: `rgba(${themeVars.colors.palette.error.defaultChannel} / .2)`,
					}}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
				<Card title={t("sys.analysis.website_visits")}>
					<CardHeader>
						<CardTitle>{t("sys.analysis.website_visits")}</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartMixed />
					</CardContent>
				</Card>
				<Card title={t("sys.analysis.current_visits")}>
					<CardHeader>
						<CardTitle>{t("sys.analysis.current_visits")}</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartPie />
					</CardContent>
				</Card>
				<Card title={t("sys.analysis.conversion_rates")}>
					<CardHeader>
						<CardTitle>{t("sys.analysis.conversion_rates")}</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartBar />
					</CardContent>
				</Card>
				<Card title={t("sys.analysis.current_subject")}>
					<CardHeader>
						<CardTitle>{t("sys.analysis.current_subject")}</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartRadar />
					</CardContent>
				</Card>
				<Card title={t("sys.analysis.order_timeline")}>
					<CardHeader>
						<CardTitle>{t("sys.analysis.order_timeline")}</CardTitle>
					</CardHeader>
					<CardContent>
						<AnalysisOrderTimeline />
					</CardContent>
				</Card>

				<Card title={t("sys.analysis.traffic_by_site")}>
					<CardHeader>
						<CardTitle>{t("sys.analysis.traffic_by_site")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<AnalysisTrafficCard icon={<Icon icon="ant-design:facebook-outlined" size={32} color="#1877f2" />} title="1.95k" subtitle={t("sys.analysis.facebook")} />
							<AnalysisTrafficCard icon={<Icon icon="ant-design:google-outlined" size={32} color="#df3e30" />} title="9.12k" subtitle={t("sys.analysis.google")} />

							<AnalysisTrafficCard icon={<Icon icon="eva:linkedin-fill" size={32} color="#006097" />} title="6.98k" subtitle={t("sys.analysis.linkedin")} />

							<AnalysisTrafficCard icon={<Icon icon="eva:twitter-fill" size={32} color="#1c9cea" />} title="8.49k" subtitle={t("sys.analysis.twitter")} />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default Analysis;
