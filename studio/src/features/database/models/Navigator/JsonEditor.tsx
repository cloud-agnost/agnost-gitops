import { CodeEditor } from '@/components/CodeEditor';
import { ICellEditorParams } from 'ag-grid-community';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const KEY_BACKSPACE = 'Backspace';
const KEY_DELETE = 'Delete';

const JSONEditor = forwardRef(({ eventKey, column, node, ...props }: ICellEditorParams, ref) => {
	const [value, setValue] = useState<string>('');
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
			value: JSON.stringify(startValue, null, 2),
		};
	};

	const initialState = createInitialState();

	useEffect(() => {
		setValue(initialState.value);
	}, []);

	useImperativeHandle(ref, () => {
		return {
			getValue() {
				return value;
			},
		};
	});

	return (
		<div className='w-[500px] h-[210px] bg-subtle p-1 rounded'>
			<CodeEditor
				value={value}
				onChange={(value) => setValue(value as string)}
				defaultLanguage='json'
				name={`navigator-${column.getId()}-${node.rowIndex}`}
				className='w-full h-full'
				containerClassName='w-full h-full'
				options={{
					fontSize: 12,
				}}
			/>
		</div>
	);
});

JSONEditor.displayName = 'JSONEditor';
export default JSONEditor;
