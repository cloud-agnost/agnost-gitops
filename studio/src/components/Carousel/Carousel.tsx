import { ReactElement } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './Carousel.scss';
import { Trans } from 'react-i18next';

interface CarouselProps {
	className?: string;
	showArrows: boolean;
	items: {
		key: string;
		element: ReactElement;
	}[];
}

export default function MainCarousel({ items, showArrows }: CarouselProps) {
	return (
		<Carousel
			showThumbs={false}
			showStatus={false}
			showArrows={showArrows}
			autoPlay
			interval={5000}
		>
			{items.map(({ element, key }) => (
				<div key={key}>
					<div className='carousel-item-cover'>{element}</div>
					{key && (
						<div className='carousel-item-text'>
							<Trans
								i18nKey={`general.slider.${key}`}
								components={{
									bold: <strong />,
								}}
							/>
						</div>
					)}
				</div>
			))}
		</Carousel>
	);
}
