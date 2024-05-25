import { useEditor } from '@/hooks';
import { EDITOR_OPTIONS } from '@/hooks/useEditor';
import useAuthStore from '@/store/auth/authStore';
import useUtilsStore from '@/store/version/utilsStore';
import { addLibsToEditor, cn, isEmpty } from '@/utils';
import Loadable from '@loadable/component';
import { EditorProps } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { Loading } from '../Loading';

const MonacoEditor = Loadable(() => import('@monaco-editor/react'));

interface CodeEditorProps extends Omit<EditorProps, 'defaultLanguage'> {
	containerClassName?: string;
	defaultLanguage?: 'javascript' | 'json' | 'html' | 'plaintext';
	readonly?: boolean;
	onSave?: (logic: string) => void;
	name: string;
}
export default function CodeEditor({
	containerClassName,
	value,
	className,
	readonly,
	defaultLanguage = 'javascript',
	name,
	onChange,
	onSave,
	options,
}: CodeEditorProps) {
	const { typings } = useUtilsStore();
	const [showLoader, setShowLoader] = useState(false);
	const user = useAuthStore((state) => state.user);

	function handleOnChange(value: string | undefined, ev: any) {
		onChange?.(value, ev);
	}
	const { onBeforeMount, onCodeEditorMount, onCodeEditorChange } = useEditor({
		onChange: handleOnChange,
		onSave: handleSaveLogic,
	});

	function handleSaveLogic(value: string) {
		onSave?.(value);
	}

	useEffect(() => {
		if (!isEmpty(globalThis.monaco) && defaultLanguage === 'javascript') {
			addLibsToEditor(typings ?? {});
		}
	}, [globalThis.monaco, typings]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowLoader(true);
		}, 100);

		// Simulate a loading process
		const simulateLoading = async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a 2 seconds loading process
			clearTimeout(timer);
			setShowLoader(false);
		};

		simulateLoading();

		return () => {
			clearTimeout(timer);
		};
	}, []);

	return (
		<div className={cn(containerClassName)}>
			<MonacoEditor
				theme={user?.editorSettings?.theme ?? 'night-owl'}
				beforeMount={onBeforeMount}
				className={cn('editor', className)}
				onChange={onCodeEditorChange}
				defaultValue={value}
				value={value}
				onMount={onCodeEditorMount}
				defaultLanguage={defaultLanguage}
				language={defaultLanguage}
				path={`file:///src/${name}.js`}
				loading={showLoader && <Loading />}
				keepCurrentModel
				options={{
					value,
					readOnly: readonly,
					...EDITOR_OPTIONS,
					formatOnPaste: defaultLanguage !== 'javascript',
					formatOnType: defaultLanguage !== 'javascript',
					...user?.editorSettings,
					...options,
				}}
			/>
		</div>
	);
}
