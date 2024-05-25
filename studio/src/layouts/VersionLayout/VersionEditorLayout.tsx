import { BreadCrumb, BreadCrumbItem } from '@/components/BreadCrumb';
import { Button } from '@/components/Button';
import { CodeEditor } from '@/components/CodeEditor';
import { useUpdateEffect } from '@/hooks';
import useTabStore from '@/store/version/tabStore';
import { cn, formatCode } from '@/utils';
import { FloppyDisk, PencilSimple, TestTube } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VersionEditorLayoutProps {
	children?: React.ReactNode;
	className?: string;
	loading: boolean;
	logic: string;
	breadCrumbItems?: BreadCrumbItem[];
	name: string;
	canEdit: boolean;
	onSaveLogic: (logic: string) => void;
	onTestModalOpen?: () => void;
	onEditModalOpen: () => void;
	setLogic: (logic: string) => void;
}

const initBeforeUnLoad = () => {
	const getCurrentTab = useTabStore.getState().getCurrentTab;
	window.onbeforeunload = (event) => {
		const versionId = new URLSearchParams(window.location.search).get('versionId') as string;
		const tab = getCurrentTab(versionId);
		if (tab.isDirty) {
			const e = event || window.event;
			e.preventDefault();
			if (e) {
				e.returnValue = '';
			}
			return '';
		}
	};
};

export default function VersionEditorLayout({
	children,
	logic,
	loading,
	breadCrumbItems,
	onSaveLogic,
	onTestModalOpen,
	onEditModalOpen,
	setLogic,
	className,
	name,
	canEdit,
}: VersionEditorLayoutProps) {
	const { t } = useTranslation();
	const [editedLogic, setEditedLogic] = useState(logic);

	async function handleSaveLogic() {
		const editor = monaco.editor.getEditors()[0];
		const formattedLogic = await formatCode(editor.getValue());
		setLogic(formattedLogic);
		onSaveLogic(formattedLogic);
	}

	window.onload = function () {
		initBeforeUnLoad();
	};

	useEffect(() => {
		initBeforeUnLoad();
	}, []);

	useUpdateEffect(() => {
		setEditedLogic(logic);
	}, [logic]);

	return (
		<div className={cn('h-full flex flex-col', className)}>
			<div className='flex items-center justify-between gap-6 py-2 px-4'>
				{breadCrumbItems && <BreadCrumb items={breadCrumbItems} />}
				{children}
				<div className='flex items-center gap-2'>
					<Button variant='secondary' onClick={onEditModalOpen} disabled={!canEdit}>
						<PencilSimple size={14} className='text-icon-default mr-1' />
						{t('general.edit')}
					</Button>

					{onTestModalOpen && (
						<Button variant='secondary' onClick={onTestModalOpen}>
							<TestTube size={14} className='text-icon-default mr-1' />
							{t('endpoint.test.test')}
						</Button>
					)}
					<Button variant='primary' onClick={handleSaveLogic} loading={loading} disabled={!canEdit}>
						{!loading && <FloppyDisk size={14} className='text-icon-default mr-1' />}
						{t('general.save')}
					</Button>
				</div>
			</div>

			<CodeEditor
				className='h-full'
				containerClassName='flex-1 code-editor-container'
				value={editedLogic}
				onChange={(val) => setLogic(val as string)}
				onSave={(val) => onSaveLogic(val as string)}
				name={name}
				readonly={!canEdit}
			/>
		</div>
	);
}
