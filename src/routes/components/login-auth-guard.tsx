import { useUserInfo } from "@/store/userStore";
import { useCallback, useEffect } from "react";
import { useRouter } from "../hooks";

type Props = {
	children: React.ReactNode;
};
export default function LoginAuthGuard({ children }: Props) {
	const router = useRouter();
	const user = useUserInfo();

	const check = useCallback(() => {
		const isLoggedIn = Boolean(user?.id) || Boolean(user?.correo);
		if (!isLoggedIn) {
			router.replace("/auth/login");
		}
	}, [router, user]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
