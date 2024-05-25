import { Carousel } from '@/components/Carousel';
import { Logo } from '@/components/Logo';
import { SLIDER_IMAGES } from '@/constants';
import { ReactNode } from 'react';
import './AuthLayout.scss';
import { cn } from '@/utils';

type AuthLayoutProps = {
	children: ReactNode;
	className?: string;
};

export default function AuthLayout({ children, className }: AuthLayoutProps) {
	return (
		<div className='auth-layout'>
			<div className='auth-layout-left relative'>
				<Logo className='auth-layout-app-logo' />
				<div className='flex flex-col justify-center items-center h-[90%]'>
					<Carousel
						showArrows={false}
						items={SLIDER_IMAGES.map(({ image, key }) => {
							return {
								element: <img src={image} alt={key} key={image} />,
								key,
							};
						})}
					/>
				</div>
			</div>
			<div className={cn('auth-layout-right', className)}>{children}</div>
		</div>
	);
}
