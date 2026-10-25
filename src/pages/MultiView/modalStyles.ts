import { ComponentProps } from "react";
import { CustomModal } from "../../components/Modal";

export const multiViewModalProps = {
	Modal: { scrollBehavior: "inside", size: "md" },
	ModalContent: {
		backgroundColor: "gray.900",
		color: "white",
		mx: 3,
		my: 4,
		maxH: "calc(100dvh - 32px)",
	},
} satisfies ComponentProps<typeof CustomModal>["customProps"];
