import { SVGProps } from 'react';
const SvgWarning = (props: SVGProps<SVGSVGElement>) => (
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
			className='fill-elements-subtle-yellow dark:fill-[#9B7B08]'
		/>
		<path
			d='m59.791 49.118-19.243-33.25a5.252 5.252 0 0 0-9.088 0v.002L12.216 49.118a5.25 5.25 0 0 0 4.543 7.88h38.49a5.25 5.25 0 0 0 4.542-7.88ZM34.252 30.75a1.75 1.75 0 1 1 3.5 0v8.75a1.75 1.75 0 1 1-3.5 0v-8.75ZM36.003 50a2.625 2.625 0 1 1 0-5.249 2.625 2.625 0 0 1 0 5.25Z'
			fill='#EDC535'
		/>
	</svg>
);
export default SvgWarning;
