import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from '@phosphor-icons/react';
import { cn } from '@/utils';
import './drawer.scss';
import { Button } from '../Button';

const Drawer = ({ children, onOpenChange, ...props }: SheetPrimitive.DialogProps) => (
	<SheetPrimitive.Root
		onOpenChange={(status) => {
			onOpenChange?.(status);
			if (!status) {
				setTimeout(() => {
					document.body.style.pointerEvents = '';
				}, 50);
			}
		}}
		{...props}
	>
		{children}
	</SheetPrimitive.Root>
);

const DrawerTrigger = SheetPrimitive.Trigger;

const DrawerClose = SheetPrimitive.Close;

const portalVariants = cva('drawer-portal', {
	variants: {
		position: {
			left: 'drawer-portal-left',
			right: 'drawer-portal-right',
			center: 'drawer-portal-center',
		},
	},
	defaultVariants: { position: 'right' },
});

interface DrawerPortalProps
	extends SheetPrimitive.DialogPortalProps,
		VariantProps<typeof portalVariants> {}

const DrawerPortal = ({ position, children, ...props }: DrawerPortalProps) => (
	<SheetPrimitive.Portal {...props}>
		<div className={portalVariants({ position })}>{children}</div>
	</SheetPrimitive.Portal>
);
DrawerPortal.displayName = SheetPrimitive.Portal.displayName;

const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Overlay className={cn('drawer-overlay', className)} {...props} ref={ref} />
));
DrawerOverlay.displayName = SheetPrimitive.Overlay.displayName;

const drawerVariants = cva('drawer', {
	variants: {
		position: {
			left: 'drawer-left',
			right: 'drawer-right',
			center: 'drawer-center',
		},
		size: {
			md: '',
			lg: '',
		},
	},
	compoundVariants: [
		{
			position: ['right', 'left'],
			size: 'md',
			class: 'drawer-md',
		},
		{
			position: ['right', 'left'],
			size: 'lg',
			class: 'drawer-lg',
		},
	],
	defaultVariants: {
		position: 'right',
		size: 'md',
	},
});

export interface DialogContentProps
	extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
		VariantProps<typeof drawerVariants> {}

const DrawerContent = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Content>,
	DialogContentProps
>(({ position, size, className, children, ...props }, ref) => (
	<DrawerPortal position={position}>
		<DrawerOverlay />
		<SheetPrimitive.Content
			ref={ref}
			className={cn(drawerVariants({ position, size }), className, 'drawer-content')}
			{...props}
		>
			{children}
		</SheetPrimitive.Content>
	</DrawerPortal>
));
DrawerContent.displayName = SheetPrimitive.Content.displayName;

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('drawer-header', className)} {...props}>
		{props.children}
		<SheetPrimitive.Close asChild>
			<Button rounded variant='icon' size='sm' className='!h-[unset] !p-1'>
				<X size={24} />
			</Button>
		</SheetPrimitive.Close>
	</div>
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('drawer-footer', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Title ref={ref} className={cn('drawer-title', className)} {...props} />
));
DrawerTitle.displayName = SheetPrimitive.Title.displayName;

export {
	Drawer,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
};
