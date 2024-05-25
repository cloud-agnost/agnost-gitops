import { SVGProps } from 'react';
const SvgError = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width='1em'
		height='1em'
		viewBox='0 0 72 72'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<rect
			width={72}
			height={72}
			rx={36}
			fillOpacity={0.6}
			className='fill-elements-subtle-red dark:fill-[#9F2D49]'
		/>
		<path
			d='M36 12.666c-12.904 0-23.334 10.43-23.334 23.334 0 12.903 10.43 23.333 23.333 23.333 12.904 0 23.334-10.43 23.334-23.333 0-12.904-10.43-23.334-23.334-23.334Zm11.666 31.71-3.29 3.29-8.377-8.376-8.376 8.377-3.29-3.29L32.709 36l-8.376-8.377 3.29-3.29 8.376 8.377 8.377-8.377 3.29 3.29L39.289 36l8.377 8.377Z'
			fill='#F16385'
		/>
	</svg>
);
export default SvgError;
