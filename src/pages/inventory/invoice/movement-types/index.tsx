import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

interface MovementTypeInfo {
	id: number;
	nombre: string;
	descripcion: string | null;
	afecta_stock: "ENTRADA" | "SALIDA";
}

// TODO: Conectar con la API real
const MOVEMENT_TYPES: MovementTypeInfo[] = [];

export default function MovementTypesPage() {
	const { t } = useLocale();

	const columns: ColumnsType<MovementTypeInfo> = [
		{
			title: t("sys.nav.inventory.invoice.types.index"),
			dataIndex: "nombre",
			width: 200,
		},
		{
			title: t("sys.nav.inventory.invoice.types.description"),
			dataIndex: "descripcion",
			width: 300,
			ellipsis: true,
			render: (descripcion) => descripcion || "-",
		},
		{
			title: t("sys.nav.inventory.invoice.types.stock_effect.index"),
			dataIndex: "afecta_stock",
			width: 150,
			align: "center",
			render: (tipo) => (
				<Badge variant={tipo === "ENTRADA" ? "success" : "error"}>{t(`sys.nav.inventory.invoice.types.stock_effect.${tipo.toLowerCase()}`)}</Badge>
			),
		},
		{
			title: t("sys.nav.inventory.invoice.types.actions"),
			key: "operation",
			width: 120,
			align: "center",
			render: (_) => (
				<div className="flex w-full justify-center text-gray-500">
					<Button variant="ghost" size="icon" onClick={() => {}}>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button variant="ghost" size="icon">
						<Icon icon="mingcute:delete-2-fill" size={18} className="text-error!" />
					</Button>
				</div>
			),
		},
	];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{t("sys.nav.inventory.invoice.types.index")}</div>
					<Button onClick={() => {}}>{t("sys.nav.inventory.invoice.types.new")}</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Table rowKey="id" size="small" scroll={{ x: "max-content" }} pagination={false} columns={columns} dataSource={MOVEMENT_TYPES} />
			</CardContent>
		</Card>
	);
}
