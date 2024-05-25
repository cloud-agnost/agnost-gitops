import { Button } from '@/components/Button';
import useModelStore from '@/store/database/modelStore';
import useNavigatorStore from '@/store/database/navigatorStore';
import { FieldTypes, Model } from '@/types';
import { ICellEditorParams } from 'ag-grid-community';
import { useParams } from 'react-router-dom';

interface SubObjectProps extends ICellEditorParams {
	subId: string;
	type: FieldTypes;
}

export default function SubObject({ subId, type, value, node, data, colDef }: SubObjectProps) {
	const { getSpecificModelByIidOfDatabase, setNestedModels } = useModelStore();

	const { dbId, orgId, versionId, appId } = useParams() as Record<string, string>;
	function getModel() {
		return getSpecificModelByIidOfDatabase({
			orgId: orgId,
			appId: appId,
			versionId: versionId,
			dbId: dbId,
			modelIid: subId as string,
			onSuccess: (model: Model) => {
				setNestedModels(model.name, node.rowIndex as number);
				if (value || model.fields.length > 0) {
					useNavigatorStore.setState({
						subModelData: type === FieldTypes.OBJECT_LIST ? value : [value],
						selectedSubModelId: data.id,
					});
				} else {
					useNavigatorStore.setState({
						subModelData: [],
						selectedSubModelId: data.id,
					});
				}
			},
		});
	}

	return (
		<Button className='link' variant='blank' onClick={getModel}>
			{colDef?.field}
		</Button>
	);
}
