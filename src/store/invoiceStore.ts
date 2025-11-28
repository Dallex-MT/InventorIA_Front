import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type InvoiceStore = {
	selectedInvoiceId?: number;
	actions: {
		setSelectedInvoiceId: (id: number) => void;
		clearSelectedInvoiceId: () => void;
	};
};

const useInvoiceStore = create<InvoiceStore>()(
	persist(
		(set) => ({
			selectedInvoiceId: undefined,
			actions: {
				setSelectedInvoiceId: (id) => set({ selectedInvoiceId: id }),
				clearSelectedInvoiceId: () => set({ selectedInvoiceId: undefined }),
			},
		}),
		{
			name: "invoiceStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ selectedInvoiceId: state.selectedInvoiceId }),
		},
	),
);

export const useInvoiceState = () => useInvoiceStore((s) => ({ selectedInvoiceId: s.selectedInvoiceId }));
export const useInvoiceActions = () => useInvoiceStore((s) => s.actions);

export default useInvoiceStore;
