import { SVGProps } from 'react';
const SvgInteger = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width='1em'
		height='1em'
		viewBox='0 0 20 20'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<g clipPath='url(#Integer_svg__a)' fill='currentColor'>
			<path d='M4.118 2.353H0v1.176h2.941v8.236H0v1.176h7.059v-1.176H4.118V2.353ZM8.234 5.883h4.118v3.53H8.234v5.881h5.294v-1.176H9.412v-3.53h4.117V4.707H8.235v1.177ZM14.703 7.059v1.176h4.118v3.53H15.88v1.176h2.94v3.53h-4.117v1.176h5.294V7.06h-5.294Z' />
		</g>
		<defs>
			<clipPath id='Integer_svg__a'>
				<path fill='currentColor' d='M0 0h20v20H0z' />
			</clipPath>
		</defs>
	</svg>
);
export default SvgInteger;
