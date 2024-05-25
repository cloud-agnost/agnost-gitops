'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getNameForAvatar } from '@/utils';
import { cva, type VariantProps } from 'class-variance-authority';

import './avatar.scss';
import { BASE_URL_WITH_API } from '@/constants';
const avatarVariants = cva('avatar', {
	variants: {
		size: {
			xxs: 'avatar-xxs',
			xs: 'avatar-xs',
			sm: 'avatar-sm',
			md: 'avatar-md',
			lg: 'avatar-lg',
			xl: 'avatar-xl',
			'2xl': 'avatar-2xl',
			'3xl': 'avatar-3xl',
			'4xl': 'avatar-4xl',
		},
		square: {
			true: 'avatar-square',
		},
		defaultVariants: {
			size: 'md',
			square: false,
		},
	},
});

export interface AvatarProps
	extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
		VariantProps<typeof avatarVariants> {
	size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
	square?: boolean;
}

export interface AvatarImageProps
	extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
	className?: string;
}

export interface AvatarFallbackProps
	extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
	className?: string;
	name?: string;
	color: string;
	isUserAvatar?: boolean;
}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
	({ size, className, square, ...props }, ref) => (
		<AvatarPrimitive.Root
			ref={ref}
			className={cn(avatarVariants({ size, square }), className)}
			{...props}
		/>
	),
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Image>,
	AvatarImageProps
>(({ className, ...props }, ref) => {
	const source = props.src ? `${BASE_URL_WITH_API}/${props.src}` : undefined;
	return (
		<AvatarPrimitive.Image
			ref={ref}
			className={cn('avatar-image', className)}
			{...props}
			src={source}
		/>
	);
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Fallback>,
	AvatarFallbackProps
>(({ className, color, isUserAvatar, ...props }, ref) => {
	const name = getNameForAvatar(props.name as string);
	return (
		<AvatarPrimitive.Fallback
			ref={ref}
			className={cn(
				'avatar-fallback',
				isUserAvatar ? 'avatar-fallback-user' : 'avatar-fallback-org',
				className,
			)}
			style={{
				backgroundColor: color,
			}}
			{...props}
			delayMs={200}
		>
			{name}
		</AvatarPrimitive.Fallback>
	);
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
