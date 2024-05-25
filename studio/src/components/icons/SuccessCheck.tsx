import { SVGProps } from 'react';
const SvgSuccessCheck = (props: SVGProps<SVGSVGElement>) => (
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
			fillOpacity={0.4}
			className='fill-elements-subtle-green dark:fill-[#0B7D46]'
		/>
		<path
			d='M36 13.25A22.75 22.75 0 1 0 58.75 36 22.777 22.777 0 0 0 36 13.25Zm10.835 18.766-12.834 12.25a1.756 1.756 0 0 1-2.42 0l-6.416-6.125a1.751 1.751 0 0 1 2.42-2.532l5.206 4.971 11.624-11.096a1.752 1.752 0 0 1 2.42 2.532Z'
			fill='#39C682'
		/>
	</svg>
);
export default SvgSuccessCheck;
