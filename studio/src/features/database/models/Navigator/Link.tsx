import { ICellEditorParams } from 'ag-grid-community';
import { Link } from 'react-router-dom';

export default function LinkField({ value }: ICellEditorParams<any, string>) {
	return (
		<Link
			to={value as string}
			className='link truncate block'
			target='_blank'
			rel='noopener noreferrer'
		>
			{value}
		</Link>
	);
}
