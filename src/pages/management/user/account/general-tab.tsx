import { useUserInfo } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardFooter } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { faker } from "@faker-js/faker";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type FieldType = {
	name?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	code?: string;
	about: string;
};

export default function GeneralTab() {
	const { avatar, username, email } = useUserInfo();
	const { t } = useTranslation();
	const form = useForm<FieldType>({
		defaultValues: {
			name: username,
			email,
			phone: faker.phone.number(),
			address: faker.location.county(),
			city: faker.location.city(),
			code: faker.location.zipCode(),
			about: faker.lorem.paragraphs(),
		},
	});

	const handleClick = () => {
		toast.success("Update success!");
	};

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div className="flex-1">
				<Card className="px-6! pb-10! pt-20!">
					<img src={avatar} className="h-16 w-16 rounded-full md:h-32 md:w-32 mx-auto mb-10 mt-[-1rem]" alt="" />

					<Button variant="destructive">{t("sys.nav.user.delete")}</Button>
				</Card>
			</div>
			<div className="flex-2">
				<Card>
					<CardContent>
						<Form {...form}>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.username")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.email")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.phone")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="address"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.address")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.city")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.code")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="about"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("sys.nav.user.about")}</FormLabel>
											<FormControl>
												<Textarea {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
						</Form>
					</CardContent>
					<CardFooter>
						<Button onClick={handleClick}>{t("sys.nav.user.save")}</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
