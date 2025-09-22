import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type FieldType = {
	oldPassword: string;
	newPassword: string;
	confirmPassword: string;
};

export default function SecurityTab() {
	const { t } = useTranslation();
	const form = useForm<FieldType>({
		defaultValues: {
			oldPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const handleSubmit = () => {
		// Handle form submission here
		toast.success("Update success!");
	};

	return (
		<Card>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="oldPassword"
							rules={{ required: t("sys.nav.user.old_password_placeholder") }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("sys.nav.user.old_password")}</FormLabel>
									<FormControl>
										<Input type="password" {...field} placeholder={t("sys.nav.user.old_password_placeholder")} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="newPassword"
							rules={{ required: t("sys.nav.user.new_password_placeholder") }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("sys.nav.user.new_password")}</FormLabel>
									<FormControl>
										<Input type="password" {...field} placeholder={t("sys.nav.user.new_password_placeholder")} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							rules={{
								required: t("sys.nav.user.confirm_password_placeholder"),
								validate: (value) => value === form.getValues("newPassword") || "Passwords do not match",
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("sys.nav.user.confirm_password")}</FormLabel>
									<FormControl>
										<Input type="password" {...field} placeholder={t("sys.nav.user.confirm_password_placeholder")} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex w-full justify-end">
							<Button type="submit">{t("sys.nav.user.save")}</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
