import { forwardRef, MouseEvent } from "react";
// eslint-disable-next-line no-restricted-imports
import { Link as ChakraLink, LinkProps as ChakraLinkProps } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

interface CustomLinkProps extends ChakraLinkProps {
	href: string;
	isExact?: boolean;
}

export const CustomLink = forwardRef<HTMLAnchorElement, CustomLinkProps>(
	({ href, children, onClick, target, isExact, ...props }, ref) => {
		const navigate = useNavigate();
		const location = useLocation();

		const isActive = isExact ? location.pathname === href : location.pathname.startsWith(href);

		const isExternalLink = props.isExternal || /^(http|https|mailto|tel):/.test(href);

		const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
			if (onClick) {
				onClick(e);
			}

			// 브라우저 기본 동작(새 탭 열기 등)을 보장하기 위한 예외 처리
			if (
				isExternalLink ||
				e.defaultPrevented || // 이미 다른 곳에서 이벤트가 막힌 경우
				e.button !== 0 || // 좌클릭이 아닌 마우스 클릭인 경우
				e.metaKey ||
				e.ctrlKey ||
				e.shiftKey ||
				e.altKey ||
				target === "_blank"
			) {
				return;
			}

			// 순수 좌클릭일 때 기본 새로고침을 막고 SPA 라우팅 처리
			e.preventDefault();
			navigate(href);
		};

		return (
			<ChakraLink
				ref={ref}
				href={href}
				target={target}
				onClick={handleClick}
				aria-current={isActive ? "page" : undefined}
				{...props}
			>
				{children}
			</ChakraLink>
		);
	},
);

CustomLink.displayName = "CustomLink";

export const Link = CustomLink;
