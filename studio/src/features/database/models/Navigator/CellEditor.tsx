import { ICellEditorParams } from 'ag-grid-community';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Input } from '@/components/Input';
import { FieldTypes } from '@/types';
import { DATE_FORMAT, DATE_TIME_FORMAT, convertUTC } from '@/utils';
import { InputMask, Replacement } from '@react-input/mask';
const KEY_BACKSPACE = 'Backspace';
const KEY_DELETE = 'Delete';

export interface CellEditorProps extends ICellEditorParams {
	mask: string;
	replacement: Replacement;
	type: FieldTypes;
}

const CellEditor = forwardRef(
	({ eventKey, type, mask, replacement, ...props }: CellEditorProps, ref) => {
		const createInitialState = () => {
			let startValue;

			if (eventKey === KEY_BACKSPACE || eventKey === KEY_DELETE) {
				startValue = '';
			} else if (eventKey && eventKey.length === 1) {
				startValue = eventKey;
			} else {
				startValue = props.value;
			}

			return {
				value: convertValue(startValue),
			};
		};

		const initialState = createInitialState();
		const [value, setValue] = useState(initialState.value);
		const refInput = useRef<HTMLInputElement>(null);

		// focus on the input
		useEffect(() => {
			// get ref from React component
			window.setTimeout(() => {
				const eInput = refInput.current!;
				eInput.focus();
			});
		}, []);

		useImperativeHandle(ref, () => {
			return {
				getValue() {
					return value;
				},
			};
		});

		function convertValue(value: string) {
			if (!value) return '';
			if (type === FieldTypes.DATETIME) return convertUTC(value, DATE_TIME_FORMAT);
			if (type === FieldTypes.DATE) return convertUTC(value, DATE_FORMAT);
			return value;
		}

		return (
			<InputMask
				component={Input}
				mask={mask}
				replacement={replacement}
				separate
				value={value || ''}
				ref={refInput}
				onChange={(event: any) => setValue(event.target.value)}
				className='w-full h-full border-none outline-none px-2'
			/>
		);
	},
);

CellEditor.displayName = 'CellEditor';
export default CellEditor;
