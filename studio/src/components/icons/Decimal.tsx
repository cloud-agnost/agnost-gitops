import { SVGProps } from 'react';
const SvgDecimal = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width='1em'
		height='1em'
		viewBox='0 0 20 20'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M6.46 3.75a2.708 2.708 0 0 1 5.418 0v4.167a2.708 2.708 0 0 1-5.417 0V3.75Zm2.71-1.458c-.806 0-1.46.653-1.46 1.458v4.167a1.458 1.458 0 1 0 2.918 0V3.75c0-.805-.653-1.458-1.459-1.458ZM10.864 12.892a.625.625 0 0 1 0 .883l-2.058 2.059 2.058 2.058a.625.625 0 1 1-.884.883l-2.5-2.5a.625.625 0 0 1 0-.883l2.5-2.5a.625.625 0 0 1 .884 0ZM2.71 10c0-.345.28-.625.626-.625h.417a.625.625 0 0 1 0 1.25h-.417A.625.625 0 0 1 2.71 10Z'
			fill='currentColor'
		/>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M7.297 15.834c0-.346.28-.625.625-.625h8.75a.625.625 0 0 1 0 1.25h-8.75a.625.625 0 0 1-.625-.625Z'
			fill='currentColor'
		/>
	</svg>
);
export default SvgDecimal;
