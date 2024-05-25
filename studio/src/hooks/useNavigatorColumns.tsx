import { CellMaskMap, CellRendererMap, CellTypeMap, NavigatorCellEditorMap } from '@/constants';
import { NavigatorColumns } from '@/features/database/models/Navigator';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import { Field, FieldTypes, ResourceInstances } from '@/types';
import { DATE_FORMAT, DATE_TIME_FORMAT, convertUTC, getValueFromData } from '@/utils';
import { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import _ from 'lodash';
import { useMemo } from 'react';

export default function useNavigatorColumns() {
	const database = useDatabaseStore((state) => state.database);
	const { model, subModel } = useModelStore();
	const hasSubModel = !_.isEmpty(subModel);
	const fields = hasSubModel ? subModel?.fields : model?.fields;
	function valueFormatter({ value }: ValueFormatterParams, field: Field) {
		if (field.type === FieldTypes.DECIMAL) {
			return Number(value);
		}

		if (field.type === FieldTypes.JSON) {
			return JSON.stringify(value, null, 2);
		}

		if ([FieldTypes.DATETIME, FieldTypes.CREATED_AT, FieldTypes.UPDATED_AT].includes(field.type)) {
			return convertUTC(value, DATE_TIME_FORMAT);
		}
		if (field.type === FieldTypes.DATE) return convertUTC(value, DATE_FORMAT);

		if (FieldTypes.GEO_POINT === field.type) {
			return `${database.type === 'MongoDB' ? value?.coordinates?.[0] : value?.x} - ${
				database.type === 'MongoDB' ? value?.coordinates?.[1] : value?.y
			}`;
		}

		if (field.type === FieldTypes.ENCRYPTED_TEXT) {
			return value?.split('').fill('*').join('');
		}

		return value;
	}

	return useMemo(() => {
		if (!fields) return NavigatorColumns;
		const newNavigatorColumns: ColDef[] = fields?.map((field) => ({
			field: field.type === FieldTypes.ID ? 'id' : field.name,
			pinned: field.type === FieldTypes.ID ? 'left' : undefined,
			valueGetter: (params: ValueGetterParams) => {
				return getValueFromData(params.data, field.type === FieldTypes.ID ? 'id' : field.name);
			},
			editable:
				field.creator !== 'system' &&
				field.type !== FieldTypes.BINARY &&
				field.type !== FieldTypes.OBJECT &&
				field.type !== FieldTypes.OBJECT_LIST &&
				!field.immutable,
			headerComponentParams: {
				type: field.type,
				label: field.name,
				field: field.name,
				filterable: field.indexed,
				selectList: field.enum?.selectList,
				entityId: model._id,
			},
			maxWidth:
				field.type === FieldTypes.ID && database.type !== ResourceInstances.MongoDB ? 100 : 10000,
			cellEditor: NavigatorCellEditorMap[field.type],
			cellRenderer: CellRendererMap[field.type],
			cellEditorPopup:
				field.type === FieldTypes.RICH_TEXT ||
				field.type === FieldTypes.JSON ||
				field.type === FieldTypes.GEO_POINT,

			cellEditorParams: {
				mask: CellMaskMap[field.type]?.mask,
				replacement: CellMaskMap[field.type]?.replacement,
				type: field.type,
				decimalPlaces: field.decimal?.decimalDigits,
				values: field.enum?.selectList,
			},
			cellRendererParams: {
				type: field.type,
				referenceModelIid: field.reference?.iid,
				subId: field.type === FieldTypes.OBJECT_LIST ? field.objectList?.iid : field.object?.iid,
			},
			cellDataType: CellTypeMap[field.type],
			valueFormatter: (params) => valueFormatter(params, field),
			resizable: true,
		}));
		return [NavigatorColumns[0], ...newNavigatorColumns, NavigatorColumns[1]];
	}, [fields]);
}
