import { formatCode, getTabIdFromUrl } from '@/utils';
import { BeforeMount, EditorProps, OnChange } from '@monaco-editor/react';
import { Linter } from 'eslint-linter-browserify';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as active4d from 'monaco-themes/themes/Active4D.json';
import * as allHallowsEve from 'monaco-themes/themes/All Hallows Eve.json';
import * as amy from 'monaco-themes/themes/Amy.json';
import * as birdsOfParadise from 'monaco-themes/themes/Birds of Paradise.json';
import * as blackboard from 'monaco-themes/themes/Blackboard.json';
import * as brillianceBlack from 'monaco-themes/themes/Brilliance Black.json';
import * as brillianceDull from 'monaco-themes/themes/Brilliance Dull.json';
import * as chromeDevtools from 'monaco-themes/themes/Chrome DevTools.json';
import * as cloudsMidnight from 'monaco-themes/themes/Clouds Midnight.json';
import * as clouds from 'monaco-themes/themes/Clouds.json';
import * as cobalt from 'monaco-themes/themes/Cobalt.json';
import * as cobalt2 from 'monaco-themes/themes/Cobalt2.json';
import * as dawn from 'monaco-themes/themes/Dawn.json';
import * as dracula from 'monaco-themes/themes/Dracula.json';
import * as dreamweaver from 'monaco-themes/themes/Dreamweaver.json';
import * as eiffel from 'monaco-themes/themes/Eiffel.json';
import * as espressoLibre from 'monaco-themes/themes/Espresso Libre.json';
import * as githubDark from 'monaco-themes/themes/GitHub Dark.json';
import * as githubLight from 'monaco-themes/themes/GitHub Light.json';
import * as github from 'monaco-themes/themes/GitHub.json';
import * as idle from 'monaco-themes/themes/IDLE.json';
import * as katzenmilch from 'monaco-themes/themes/Katzenmilch.json';
import * as kuroirTheme from 'monaco-themes/themes/Kuroir Theme.json';
import * as lazy from 'monaco-themes/themes/LAZY.json';
import * as magicWbAmiga from 'monaco-themes/themes/MagicWB (Amiga).json';
import * as merbivoreSoft from 'monaco-themes/themes/Merbivore Soft.json';
import * as merbivore from 'monaco-themes/themes/Merbivore.json';
import * as monokaiBright from 'monaco-themes/themes/Monokai Bright.json';
import * as monokai from 'monaco-themes/themes/Monokai.json';
import * as nightOwl from 'monaco-themes/themes/Night Owl.json';
import * as nord from 'monaco-themes/themes/Nord.json';
import * as oceanicNext from 'monaco-themes/themes/Oceanic Next.json';
import * as pastelsOnDark from 'monaco-themes/themes/Pastels on Dark.json';
import * as slushAndPoppies from 'monaco-themes/themes/Slush and Poppies.json';
import * as solarizedDark from 'monaco-themes/themes/Solarized-dark.json';
import * as solarizedLight from 'monaco-themes/themes/Solarized-light.json';
import * as spacecadet from 'monaco-themes/themes/SpaceCadet.json';
import * as sunburst from 'monaco-themes/themes/Sunburst.json';
import * as textmateMacClassic from 'monaco-themes/themes/Textmate (Mac Classic).json';
import * as tomorrowNightBlue from 'monaco-themes/themes/Tomorrow-Night-Blue.json';
import * as tomorrowNightBright from 'monaco-themes/themes/Tomorrow-Night-Bright.json';
import * as tomorrowNightEighties from 'monaco-themes/themes/Tomorrow-Night-Eighties.json';
import * as tomorrowNight from 'monaco-themes/themes/Tomorrow-Night.json';
import * as tomorrow from 'monaco-themes/themes/Tomorrow.json';
import * as twilight from 'monaco-themes/themes/Twilight.json';
import * as upstreamSunburst from 'monaco-themes/themes/Upstream Sunburst.json';
import * as vibrantInk from 'monaco-themes/themes/Vibrant Ink.json';
import * as xcodeDefault from 'monaco-themes/themes/Xcode_default.json';
import * as zenburnesque from 'monaco-themes/themes/Zenburnesque.json';
import * as iplastic from 'monaco-themes/themes/iPlastic.json';
import * as idlefingers from 'monaco-themes/themes/idleFingers.json';
import * as krtheme from 'monaco-themes/themes/krTheme.json';
import * as monoindustrial from 'monaco-themes/themes/monoindustrial.json';
import { useEffect, useRef } from 'react';
import config from '../helpers/eslint.json';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Tab } from '@/types';
import { useDebounceFn } from '.';
import { SURROUND_MENU_ITEMS } from '@/constants';
import { useSearchParams } from 'react-router-dom';
export const EDITOR_OPTIONS: EditorProps['options'] = {
	minimap: {
		enabled: false,
	},
	quickSuggestions: {
		strings: true,
		other: true,
		comments: true,
	},
	guides: {
		indentation: false,
		highlightActiveIndentation: true,
	},
	autoClosingBrackets: 'always',
	autoDetectHighContrast: true,
	lineNumbersMinChars: 3,
	scrollBeyondLastLine: false,
	scrollbar: {},
	renderLineHighlight: 'all',
	folding: true,
	codeLens: true,
	unicodeHighlight: {
		allowedLocales: {
			tr: true,
		},
	},
};

export type CodeEditorProps = {
	onChange?: (value: string | undefined, ev: monaco.editor.IModelContentChangedEvent) => void;
	onSave?: (logic: string) => void;
};

export default function useEditor({ onChange, onSave }: CodeEditorProps) {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
	const linter = new Linter();
	const { updateCurrentTab, getTabById } = useTabStore();
	const { version } = useVersionStore();
	const [searchParams] = useSearchParams();
	const setTabState = useDebounceFn((isDirty) => {
		if (
			editor.getModel()?.getLanguageId() === 'javascript' &&
			!editor.getOption(monaco.editor.EditorOption.readOnly)
		) {
			const tabId = getTabIdFromUrl();
			const tab = getTabById(version?._id, tabId as string) as Tab;
			if (tab?.type.toLowerCase() === tab?.path) return;
			updateCurrentTab(version?._id, {
				...tab,
				isDirty,
			});
		}
	}, 500);
	async function saveEditorContent(language: string | undefined, cb?: (value: string) => void) {
		const ed = editorRef.current;
		const val = ed?.getValue() as string;

		if (language === 'json') {
			ed?.trigger('', 'editor.action.formatDocument', null);
		}
		if (language === 'javascript') {
			const formatted = await formatCode(val);
			const fullRange = ed?.getModel()?.getFullModelRange();
			ed?.executeEdits(null, [
				{
					text: formatted,
					range: fullRange as monaco.Range,
				},
			]);

			ed?.pushUndoStop();
			cb?.(formatted);
		}
	}

	function configureEditor(editor: monaco.editor.IStandaloneCodeEditor, monaco: any) {
		const validate = (code: string) => {
			if (editor.getModel()?.getLanguageId() !== 'javascript') return;
			const messages = linter.verify(
				code,
				config as Linter.Config<Linter.RulesRecord, Linter.RulesRecord>,
			);
			monaco.editor.setModelMarkers(
				editorRef.current?.getModel(),
				'eslint',
				messages.map((message: { line: any; column: any; message: any; severity: number }) => ({
					startLineNumber: message.line,
					endLineNumber: message.line,
					startColumn: message.column,
					endColumn: message.column,
					message: message.message,
					severity:
						message.severity === 1 ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
				})),
			);
		};

		validate(editor.getValue());
		editor.onDidFocusEditorText(() => {
			editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
				editor.trigger('editor', 'editor.action.formatDocument', undefined);
				saveEditorContent(editor.getModel()?.getLanguageId(), onSave);
			});
		});
		editor.onDidChangeModelContent((e) => {
			validate(editor.getValue());
			setTabState(editor.getValue() !== e.changes[0].text);
		});

		editor.onDidPaste(() => {
			setTabState(true);
		});

		monaco.languages.registerDocumentFormattingEditProvider('typescript', {
			async provideDocumentFormattingEdits(model: any) {
				return [
					{
						range: model.getFullModelRange(),
						text: await formatCode(model.getValue()),
					},
				];
			},
		});
	}

	const onBeforeMount: BeforeMount = (monaco) => {
		monaco.editor.defineTheme('active4d', active4d as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'all-hallows-eve',
			allHallowsEve as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('amy', amy as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'birds-of-paradise',
			birdsOfParadise as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('blackboard', blackboard as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'brilliance-black',
			brillianceBlack as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'brilliance-dull',
			brillianceDull as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'chrome-devtools',
			chromeDevtools as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'clouds-midnight',
			cloudsMidnight as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('clouds', clouds as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('cobalt', cobalt as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('cobalt2', cobalt2 as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('dawn', dawn as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('dracula', dracula as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('dreamweaver', dreamweaver as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('eiffel', eiffel as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'espresso-libre',
			espressoLibre as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('github-dark', githubDark as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('github-light', githubLight as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('github', github as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('idle', idle as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('katzenmilch', katzenmilch as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('kuroir-theme', kuroirTheme as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('lazy', lazy as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'magicwb--amiga-',
			magicWbAmiga as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'merbivore-soft',
			merbivoreSoft as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('merbivore', merbivore as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'monokai-bright',
			monokaiBright as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('monokai', monokai as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('night-owl', nightOwl as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('nord', nord as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('oceanic-next', oceanicNext as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'pastels-on-dark',
			pastelsOnDark as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'slush-and-poppies',
			slushAndPoppies as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('solarizedDark', solarizedDark as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'solarized-light',
			solarizedLight as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('spacecadet', spacecadet as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('sunburst', sunburst as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'textmate--mac-classic-',
			textmateMacClassic as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'tomorrow-night-blue',
			tomorrowNightBlue as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'tomorrow-night-bright',
			tomorrowNightBright as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'tomorrow-night-eighties',
			tomorrowNightEighties as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme(
			'tomorrow-night',
			tomorrowNight as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('tomorrow', tomorrow as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('twilight', twilight as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'upstream-sunburst',
			upstreamSunburst as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.defineTheme('vibrant-ink', vibrantInk as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('xcode-default', xcodeDefault as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('zenburnesque', zenburnesque as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('iplastic', iplastic as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('idlefingers', idlefingers as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme('krtheme', krtheme as monaco.editor.IStandaloneThemeData);
		monaco.editor.defineTheme(
			'monoindustrial',
			monoindustrial as monaco.editor.IStandaloneThemeData,
		);

		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.Latest,
			allowNonTsExtensions: true,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			allowJs: true,
			checkJs: true,
			strict: true,
			typeRoots: ['node_modules/@types'],
		});
	};

	function onCodeEditorMount(editor: monaco.editor.IStandaloneCodeEditor, monaco: any) {
		editorRef.current = editor;
		globalThis.editor = editor;
		configureEditor(editor, monaco);
		editor.addAction({
			id: 'open-surround',
			label: 'Surround',
			precondition: 'editorHasSelection', // Action will only be shown when there's a selection
			contextMenuGroupId: 'navigation',
			contextMenuOrder: 2,
			keybindings: [
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
				// chord
				monaco.KeyMod.chord(
					monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
					monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM,
				),
			],
			run: function (ed) {
				ed.focus();
				ed.trigger('', 'editor.action.quickCommand', '');
				const input = document.querySelector('.quick-input-box .input') as HTMLInputElement;
				input.value = '> Surround with';
				input.dispatchEvent(new Event('input', { bubbles: true }));
			},
		});
		SURROUND_MENU_ITEMS.forEach((item) => {
			editor.addAction(item);
		});
	}

	const onCodeEditorChange = (
		content: Parameters<OnChange>[0],
		ev: monaco.editor.IModelContentChangedEvent,
	) => {
		onChange?.(content, ev);
	};

	useEffect(() => {
		if (searchParams.get('line') && editorRef.current) {
			const lineNumber = Number(searchParams.get('line'));
			const range = new monaco.Range(lineNumber, 1, lineNumber, 1);
			editorRef.current.revealLineInCenter(lineNumber);
			editorRef.current.setSelection(range);
		}
	}, [searchParams.get('line'), editorRef.current]);
	return {
		onBeforeMount,
		onCodeEditorMount,
		onCodeEditorChange,
		editor: editorRef.current,
	};
}
