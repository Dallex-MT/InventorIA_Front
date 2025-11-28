import apiClient from "../apiClient";

export enum DashboardApi {
	MotivationalMessage = "/motivational-message",
}

export interface MotivationalMessageRes {
	success: boolean;
	data: {
		message: string;
		timestamp: string;
	};
}

const getMotivationalMessage = () => {
	return apiClient.get<MotivationalMessageRes>({
		url: DashboardApi.MotivationalMessage,
	});
};

export default {
	getMotivationalMessage,
};
