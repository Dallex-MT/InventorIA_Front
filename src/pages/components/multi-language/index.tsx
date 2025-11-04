import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { LocalEnum } from "#/enum";

export default function MultiLanguagePage() {
	const {
		setLocale,
		locale,
		language: { icon, label },
	} = useLocale();

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Flexible</CardTitle>
				</CardHeader>
				<CardContent>
					<RadioGroup onValueChange={(value: LocalEnum) => setLocale(value)} defaultValue={locale}>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value={LocalEnum.en_US} id="en_US" />
							<label htmlFor="en_US">English</label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value={LocalEnum.es_ES} id="es_ES" />
							<label htmlFor="es_ES">Español</label>
						</div>
					</RadioGroup>

					<div className="flex items-center text-4xl mt-4">
						<Icon icon={`local:${icon}`} className="mr-4 rounded-md" size="30" />
						{label}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
