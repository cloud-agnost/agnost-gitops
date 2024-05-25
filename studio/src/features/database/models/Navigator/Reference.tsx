import { Button } from '@/components/Button';
import useModelStore from '@/store/database/modelStore';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { ConditionsType, FieldTypes, Filters } from '@/types';
import { ICellEditorParams } from 'ag-grid-community';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
interface ReferenceProps extends ICellEditorParams {
	referenceModelIid: string;
}

export default function Reference({ value, referenceModelIid }: ReferenceProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const {
		getModelsOfSelectedDb,
		resetNestedModels,
		setModel,
		getSpecificModelByIidOfDatabase,
		model,
	} = useModelStore();
	const { setColumnFilters } = useUtilsStore();
	const { dbId, versionId, appId, orgId } = useParams() as {
		dbId: string;
		versionId: string;
		appId: string;
		orgId: string;
	};
	const { updateCurrentTab } = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const navigate = useNavigate();
	async function handleDataClick() {
		const referenceModel =
			getModelsOfSelectedDb(dbId)?.find((model) => model.iid === referenceModelIid) ??
			(await getSpecificModelByIidOfDatabase({
				dbId,
				appId,
				orgId,
				versionId,
				modelIid: referenceModelIid,
			}));

		if (referenceModel) {
			resetNestedModels();
			searchParams.delete('f');
			searchParams.delete('d');
			searchParams.delete('ref');
			setSearchParams(searchParams);
			setModel(referenceModel);
			const path = getVersionDashboardPath(`database/${dbId}/navigator/${referenceModel._id}`);
			updateCurrentTab(versionId, {
				path,
			});
			const fieldName =
				referenceModel.fields.find((field) => field.type === FieldTypes.ID)?.name ?? 'id';
			setColumnFilters(
				fieldName,
				{
					filterType: Filters.Text,
					conditions: [
						{
							filter: value,
							type: ConditionsType.Equals,
						},
					],
				},
				model._id,
			);
			navigate(path);
		}
	}
	return (
		<Button variant='blank' className='link justify-start' onClick={handleDataClick}>
			{value}
		</Button>
	);
}
