import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import {
	Alert,
	AlertIcon,
	Box,
	Button,
	Flex,
	FormControl,
	FormLabel,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	Stack,
	Text,
	Textarea,
	useColorMode,
	useMediaQuery,
} from "@chakra-ui/react";
import {
	feedbackCategories,
	FEEDBACK_API_URL,
	FEEDBACK_SITE_KEY,
	FEEDBACK_SOURCE_SITE,
	type FeedbackData,
} from "@/lib/feedback";
import { loadTurnstile, type Turnstile } from "@/lib/turnstile";

interface FeedbackDialogProps {
	onClose: () => void;
	finalFocusRef: RefObject<HTMLButtonElement>;
	retryAt: number;
	onRateLimit: (until: number) => void;
}

export default function FeedbackDialog({ onClose, finalFocusRef, retryAt, onRateLimit }: FeedbackDialogProps) {
	const messageRef = useRef<HTMLTextAreaElement>(null);
	const requestRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(false);
	const [widgetContainer, setWidgetContainer] = useState<HTMLDivElement | null>(null);
	const [category, setCategory] = useState<FeedbackData["category"]>("bug");
	const [message, setMessage] = useState("");
	const [token, setToken] = useState("");
	const [verificationError, setVerificationError] = useState("");
	const [interactive, setInteractive] = useState(false);
	const [widgetVersion, setWidgetVersion] = useState(0);
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);
	const [sent, setSent] = useState(false);
	const [now, setNow] = useState(Date.now);
	const { colorMode } = useColorMode();
	const [isNarrow] = useMediaQuery("(max-width: 400px)");
	const normalizedMessage = message.replace(/\s+/gu, " ").trim();
	const characters = Array.from(normalizedMessage);
	const length = characters.length;
	const validMessage =
		length >= 10 &&
		length <= 300 &&
		characters.every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127);
	const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
	const verifying = !token && !verificationError;
	const submitLabel = verificationError
		? "다시 인증하기"
		: verifying
			? interactive ? "보안 인증을 완료해 주세요" : "보안 인증 중"
			: retrySeconds > 0 ? `${retrySeconds}초 후 다시 보내기` : "피드백 보내기";
	const refreshVerification = () => {
		setToken("");
		setVerificationError("");
		setInteractive(false);
		setWidgetVersion((value) => value + 1);
	};
	const close = () => {
		if (!requestRef.current) onClose();
	};

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			requestRef.current?.abort();
		};
	}, []);

	useEffect(() => {
		if (retryAt <= Date.now()) return;
		setNow(Date.now());
		const timer = setInterval(() => {
			setNow(Date.now());
			if (Date.now() >= retryAt) clearInterval(timer);
		}, 1000);
		return () => clearInterval(timer);
	}, [retryAt]);

	useEffect(() => {
		if (!widgetContainer || sent) return;
		let active = true;
		let api: Turnstile | undefined;
		let widgetId: string | undefined;
		setToken("");
		setVerificationError("");
		setInteractive(false);
		const verificationFailed = () => {
			if (!active) return true;
			setToken("");
			setInteractive(false);
			setVerificationError("보안 인증을 완료하지 못했어요. 다시 인증해 주세요.");
			return true;
		};
		void loadTurnstile()
			.then((turnstile) => {
				if (!active) return;
				api = turnstile;
				widgetId = api.render(widgetContainer, {
					sitekey: FEEDBACK_SITE_KEY,
					action: "feedback",
					language: "ko",
					size: isNarrow ? "compact" : "flexible",
					theme: colorMode,
					appearance: "interaction-only",
					callback: (value) => {
						if (!active) return;
						setToken(value);
						setVerificationError("");
						setInteractive(false);
					},
					"error-callback": verificationFailed,
					"expired-callback": verificationFailed,
					"timeout-callback": verificationFailed,
					"before-interactive-callback": () => {
						if (!active) return;
						setToken("");
						setVerificationError("");
						setInteractive(true);
					},
					"after-interactive-callback": () => {
						if (active) setInteractive(false);
					},
				});
				if (widgetId === undefined) verificationFailed();
			})
			.catch(verificationFailed);
		return () => {
			active = false;
			if (widgetId !== undefined) api?.remove(widgetId);
		};
	}, [widgetContainer, widgetVersion, sent, colorMode, isNarrow]);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (requestRef.current || sent || !validMessage || !token || retryAt > Date.now()) return;
		const controller = new AbortController();
		requestRef.current = controller;
		setPending(true);
		setError("");
		const timer = setTimeout(() => controller.abort(), 20000);
		try {
			// 공통 통신 로그에 피드백 내용과 인증 토큰을 남기지 않는다.
			const response = await fetch(FEEDBACK_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "omit",
				cache: "no-store",
				signal: controller.signal,
				body: JSON.stringify({
					category,
					sourceSite: FEEDBACK_SOURCE_SITE,
					message: normalizedMessage,
					turnstileToken: token,
				}),
			});
			if (!mountedRef.current) return;
			if (response.status === 201) {
				setSent(true);
				setToken("");
				setMessage("");
				return;
			}
			if (response.status === 429) {
				const header = response.headers.get("Retry-After");
				const seconds = header && /^\d+$/.test(header) ? Number(header) : NaN;
				const date = header ? Date.parse(header) : NaN;
				const until = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : date;
				onRateLimit(Number.isFinite(until) && until > Date.now() ? until : Date.now() + 20000);
				setError("요청이 잠시 많아요. 잠시 후 다시 보내주세요.");
			} else {
				const result: unknown = await response.json().catch(() => null);
				if (!mountedRef.current) return;
				const serverMessage =
					result && typeof result === "object" && "message" in result && typeof result.message === "string"
						? result.message
						: "피드백을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.";
				setError(serverMessage);
			}
			refreshVerification();
		} catch {
			if (!mountedRef.current) return;
			setError("접수 결과를 확인하지 못했어요. 이미 접수되었을 수 있으니 잠시 후 확인해 주세요.");
			refreshVerification();
		} finally {
			clearTimeout(timer);
			requestRef.current = null;
			if (mountedRef.current) setPending(false);
		}
	};

	return (
		<Modal
			isOpen
			onClose={close}
			size="lg"
			scrollBehavior="inside"
			initialFocusRef={messageRef}
			finalFocusRef={finalFocusRef}
			closeOnOverlayClick={!pending}
			closeOnEsc={!pending}
		>
			<ModalOverlay />
			<ModalContent mx={2}>
				<ModalHeader>개발자에게 피드백</ModalHeader>
				<ModalCloseButton isDisabled={pending} />
				<ModalBody>
					{sent ? (
						<Alert status="success" borderRadius="md" role="status">
							<AlertIcon />
							피드백이 접수되었어요. 의견 감사합니다!
						</Alert>
					) : (
						<Stack
							as="form"
							id="developer-feedback-form"
							spacing={4}
							aria-busy={pending}
							onSubmit={(event) => void submit(event)}
						>
							<Text fontSize="sm">사이트 오류나 개선 의견을 익명으로 보내주세요.</Text>
							<FormControl isDisabled={pending}>
								<FormLabel htmlFor="developer-feedback-category">유형</FormLabel>
								<Select
									id="developer-feedback-category"
									value={category}
									onChange={(event) => setCategory(event.target.value as FeedbackData["category"])}
								>
									{Object.entries(feedbackCategories).map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</Select>
							</FormControl>
							<FormControl isDisabled={pending}>
								<FormLabel htmlFor="developer-feedback-message">내용</FormLabel>
								<Textarea
									ref={messageRef}
									id="developer-feedback-message"
									rows={5}
									value={message}
									aria-describedby="developer-feedback-hint developer-feedback-count"
									aria-invalid={message.length > 0 && !validMessage}
									placeholder="어느 화면에서 어떤 문제가 있었는지 알려주세요."
									onChange={(event) => setMessage(event.target.value)}
								/>
								<Flex justify="space-between" gap={2} wrap="wrap" mt={2} fontSize="xs">
									<Text id="developer-feedback-hint">10~300자 · 연속 공백은 한 칸으로 계산</Text>
									<Text id="developer-feedback-count" color={length > 300 ? "red.400" : undefined}>
										{length} / 300
									</Text>
								</Flex>
							</FormControl>
							<Box>
								<Text fontSize="xs">개인정보는 적지 말아 주세요. 별도 답변은 제공되지 않아요.</Text>
								<Box
									ref={setWidgetContainer}
									mt={interactive ? 4 : 0}
									h={interactive ? "auto" : 0}
									overflow={interactive ? "visible" : "hidden"}
									aria-hidden={!interactive}
								/>
							</Box>
							{verificationError && (
								<Alert status="error" borderRadius="md" flexWrap="wrap" gap={2}>
									<AlertIcon />
									<Text flex={1}>{verificationError}</Text>
								</Alert>
							)}
							{error && (
								<Alert status="error" borderRadius="md">
									<AlertIcon />
									<Text>{error}</Text>
								</Alert>
							)}
						</Stack>
					)}
				</ModalBody>
				<ModalFooter gap={3} flexWrap="wrap">
					<Button onClick={close} isDisabled={pending}>
						닫기
					</Button>
					{!sent && (
						<Button
							type={verificationError ? "button" : "submit"}
							form="developer-feedback-form"
							colorScheme="purple"
							isLoading={pending || (verifying && !interactive)}
							loadingText={pending ? "보내는 중" : "보안 인증 중"}
							isDisabled={pending || (!verificationError && (!validMessage || !token || retrySeconds > 0))}
							onClick={verificationError ? refreshVerification : undefined}
							aria-live="polite"
						>
							{submitLabel}
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

