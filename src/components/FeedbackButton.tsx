import { useRef, useState } from "react";
import { Button, useColorModeValue } from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";
import FeedbackDialog from "./Feedback/FeedbackDialog";

export function FeedbackButton() {
	const [open, setOpen] = useState(false);
	const [retryAt, setRetryAt] = useState(0);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const hoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
	return (
		<>
			<Button ref={triggerRef} type="button" size="sm" variant="ghost" color="inherit"
				leftIcon={<FiMessageSquare aria-hidden="true" />} aria-haspopup="dialog"
				_hover={{ bg: hoverBg }} onClick={() => setOpen(true)}>
				개발자에게 피드백
			</Button>
			{open && (
				<FeedbackDialog onClose={() => setOpen(false)} finalFocusRef={triggerRef}
					retryAt={retryAt} onRateLimit={setRetryAt} />
			)}
		</>
	);
}
