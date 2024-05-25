import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import useDatabaseStore from '@/store/database/databaseStore';
import { ResourceInstances } from '@/types';
import { ICellEditorParams } from 'ag-grid-community';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const KEY_BACKSPACE = 'Backspace';
const KEY_DELETE = 'Delete';

const GeoPointEditor = forwardRef(({ eventKey, value }: ICellEditorParams, ref) => {
	const database = useDatabaseStore((state) => state.database);
	const ltdRef = useRef<HTMLInputElement>(null);
	const lngRef = useRef<HTMLInputElement>(null);
	const createInitialState = () => {
		let startValue = {
			lat: 0,
			lng: 0,
		};

		if (eventKey === KEY_BACKSPACE || eventKey === KEY_DELETE) {
			startValue = {
				lat: 0,
				lng: 0,
			};
		} else if (eventKey && eventKey.length === 1) {
			startValue = {
				lat: parseFloat(eventKey),
				lng: parseFloat(eventKey),
			};
		} else {
			startValue = {
				lat: database.type === ResourceInstances.MongoDB ? value?.coordinates?.[0] : value?.x,
				lng: database.type === ResourceInstances.MongoDB ? value?.coordinates?.[1] : value?.y,
			};
		}
		return {
			value: startValue,
		};
	};
	const initialState = createInitialState();
	const [coords, setCoords] = useState(initialState.value);

	function onChange(lat: string, lng: string) {
		const newCoords = {
			lat: parseFloat(lat),
			lng: parseFloat(lng),
		};
		setCoords(newCoords);
	}

	useImperativeHandle(ref, () => {
		return {
			getValue() {
				if (database.type === ResourceInstances.MongoDB) {
					return {
						coordinates: [coords.lng, coords.lat],
						type: 'Point',
					};
				}
				return {
					x: coords.lat,
					y: coords.lng,
				};
			},
		};
	});

	return (
		<div className='flex gap-2 items-center w-full bg-subtle p-2'>
			<div className='space-y-1'>
				<Label htmlFor='latitude'>Latitude</Label>
				<Input
					ref={ltdRef}
					type='number'
					id='latitude'
					value={coords.lat}
					onChange={(e) => onChange(e.target.value, lngRef?.current?.value as string)}
				/>
			</div>
			<div className='space-y-1'>
				<Label htmlFor='longitude'>Longitude</Label>
				<Input
					ref={lngRef}
					type='number'
					id='longitude'
					value={coords.lng}
					onChange={(e) => onChange(ltdRef?.current?.value as string, e.target.value)}
				/>
			</div>
		</div>
	);
});

GeoPointEditor.displayName = 'GeoPointEditor';
export default GeoPointEditor;
